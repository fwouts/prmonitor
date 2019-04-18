import { computed, observable } from "mobx";
import { BadgeState } from "../badge/api";
import { Environment } from "../environment/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import {
  MuteConfiguration,
  NOTHING_MUTED
} from "../storage/mute-configuration";
import { isReviewNeeded } from "./filtering/review-needed";

export class Core {
  @observable overallStatus: "loading" | "loaded" = "loading";
  @observable refreshing: boolean = false;
  @observable token: string | null = null;
  @observable loadedState: LoadedState | null = null;
  @observable muteConfiguration = NOTHING_MUTED;
  @observable notifiedPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  constructor(private readonly env: Environment) {
    this.env.messenger.listen(message => {
      console.debug("Message received", message);
      if (message.kind === "reload") {
        this.load();
      }
    });
  }

  async load() {
    this.token = await this.env.store.token.load();
    this.overallStatus = "loading";
    if (this.token !== null) {
      this.lastError = await this.env.store.lastError.load();
      this.loadedState = await this.env.store.lastCheck.load();
      this.notifiedPullRequestUrls = new Set(
        await this.env.store.notifiedPullRequests.load()
      );
      this.muteConfiguration = await this.env.store.muteConfiguration.load();
    } else {
      this.lastError = null;
      this.token = null;
      this.loadedState = null;
      this.notifiedPullRequestUrls = new Set();
      this.muteConfiguration = NOTHING_MUTED;
    }
    this.overallStatus = "loaded";
    this.updateBadge();
  }

  async setNewToken(token: string) {
    this.token = token;
    await this.env.store.token.save(token);
    await this.saveError(null);
    await this.saveNotifiedPullRequests([]);
    await this.saveLoadedState(null);
    await this.saveMuteConfiguration(NOTHING_MUTED);
    await this.load();
    this.triggerBackgroundRefresh();
  }

  async refreshPullRequests() {
    if (!this.token) {
      console.debug("Not authenticated, skipping refresh.");
      return;
    }
    if (!this.env.isOnline()) {
      console.debug("Not online, skipping refresh.");
      return;
    }
    this.refreshing = true;
    this.updateBadge();
    try {
      await this.saveLoadedState(
        await this.env.githubLoader(this.token, this.loadedState)
      );
      const unreviewedPullRequests = this.unreviewedPullRequests || [];
      await this.env.notifier.notify(
        unreviewedPullRequests,
        this.notifiedPullRequestUrls
      );
      await this.saveNotifiedPullRequests(unreviewedPullRequests);
      this.updateBadge();
      this.saveError(null);
    } catch (e) {
      this.saveError(e.message);
      throw e;
    } finally {
      this.refreshing = false;
      this.triggerReload();
    }
  }

  async mutePullRequest(pullRequest: {
    repoOwner: string;
    repoName: string;
    pullRequestNumber: number;
  }) {
    this.muteConfiguration.mutedPullRequests = [
      // Remove any previous mute of this PR.
      ...this.muteConfiguration.mutedPullRequests.filter(
        pr =>
          pr.repo.owner !== pullRequest.repoOwner ||
          pr.repo.name !== pullRequest.repoName ||
          pr.number !== pullRequest.pullRequestNumber
      ),
      // Add the new mute.
      {
        repo: {
          owner: pullRequest.repoOwner,
          name: pullRequest.repoName
        },
        number: pullRequest.pullRequestNumber,
        until: {
          kind: "next-update",
          mutedAtTimestamp: Date.now()
        }
      }
    ];
    await this.saveMuteConfiguration(this.muteConfiguration);
    this.updateBadge();
  }

  @computed
  get unreviewedPullRequests(): PullRequest[] | null {
    const lastCheck = this.loadedState;
    if (!lastCheck || !lastCheck.userLogin) {
      return null;
    }
    return lastCheck.openPullRequests.filter(pr =>
      isReviewNeeded(pr, lastCheck.userLogin!, this.muteConfiguration)
    );
  }

  private async saveNotifiedPullRequests(pullRequests: PullRequest[]) {
    this.notifiedPullRequestUrls = new Set(pullRequests.map(p => p.htmlUrl));
    await this.env.store.notifiedPullRequests.save(
      Array.from(this.notifiedPullRequestUrls)
    );
  }

  private async saveError(error: string | null) {
    this.lastError = error;
    await this.env.store.lastError.save(error);
    this.updateBadge();
  }

  private async saveLoadedState(lastCheck: LoadedState | null) {
    this.loadedState = lastCheck;
    await this.env.store.lastCheck.save(lastCheck);
  }

  private async saveMuteConfiguration(muteConfiguration: MuteConfiguration) {
    this.muteConfiguration = muteConfiguration;
    await this.env.store.muteConfiguration.save(muteConfiguration);
  }

  private updateBadge() {
    let badgeState: BadgeState;
    const unreviewedPullRequests = this.unreviewedPullRequests;
    if (this.lastError || !this.token) {
      badgeState = {
        kind: "error"
      };
    } else if (!unreviewedPullRequests) {
      badgeState = {
        kind: "initializing"
      };
    } else if (this.refreshing) {
      badgeState = {
        kind: "reloading",
        unreviewedPullRequestCount: unreviewedPullRequests.length
      };
    } else {
      badgeState = {
        kind: "loaded",
        unreviewedPullRequestCount: unreviewedPullRequests.length
      };
    }
    this.env.badger.update(badgeState);
  }

  private triggerBackgroundRefresh() {
    this.env.messenger.send({
      kind: "refresh"
    });
  }

  private triggerReload() {
    this.env.messenger.send({
      kind: "reload"
    });
  }
}
