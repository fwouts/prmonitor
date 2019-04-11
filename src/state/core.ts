import Octokit from "@octokit/rest";
import { computed, observable } from "mobx";
import { Badger, BadgeState } from "../badge/api";
import { ChromeApi } from "../chrome";
import { Notifier } from "../notifications/api";
import { Store } from "../storage/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import {
  MuteConfiguration,
  NOTHING_MUTED
} from "../storage/mute-configuration";
import { isReviewNeeded } from "./filtering/review-needed";
import { GitHubLoader } from "./github-loader";

export class Core {
  private octokit: Octokit | null = null;

  @observable overallStatus: "loading" | "loaded" = "loading";
  @observable refreshing: boolean = false;
  @observable token: string | null = null;
  @observable loadedState: LoadedState | null = null;
  @observable muteConfiguration = NOTHING_MUTED;
  @observable notifiedPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  constructor(
    private readonly chromeApi: ChromeApi,
    private readonly store: Store,
    private readonly githubLoader: GitHubLoader,
    private readonly notifier: Notifier,
    private readonly badger: Badger
  ) {
    chromeApi.runtime.onMessage.addListener(message => {
      console.debug("Message received", message);
      if (message.kind === "reload") {
        this.load();
      }
    });
  }

  async load() {
    this.token = await this.store.token.load();
    this.lastError = await this.store.lastError.load();
    this.overallStatus = "loading";
    if (this.token !== null) {
      this.octokit = new Octokit({
        auth: `token ${this.token}`
      });
      this.loadedState = await this.store.lastCheck.load();
      this.notifiedPullRequestUrls = new Set(
        await this.store.notifiedPullRequests.load()
      );
      this.muteConfiguration = await this.store.muteConfiguration.load();
    } else {
      this.token = null;
      this.octokit = null;
      this.loadedState = null;
      this.notifiedPullRequestUrls = new Set();
      this.muteConfiguration = NOTHING_MUTED;
    }
    this.overallStatus = "loaded";
    this.updateBadge();
  }

  async setNewToken(token: string) {
    this.token = token;
    await this.store.token.save(token);
    await this.saveError(null);
    await this.saveNotifiedPullRequests([]);
    await this.saveLoadedState(null);
    await this.saveMuteConfiguration(NOTHING_MUTED);
    await this.load();
    this.triggerBackgroundRefresh();
  }

  async refreshPullRequests() {
    const octokit = this.octokit;
    if (!octokit) {
      console.debug("Not authenticated, skipping refresh.");
      return;
    }
    if (!navigator.onLine) {
      console.debug("Not online, skipping refresh.");
      return;
    }
    this.refreshing = true;
    this.updateBadge();
    try {
      await this.saveLoadedState(
        await this.githubLoader(octokit, this.loadedState)
      );
      const unreviewedPullRequests = this.unreviewedPullRequests || [];
      await this.notifier.notify(
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

  async mutePullRequest(pullRequest: PullRequest) {
    this.muteConfiguration.mutedPullRequests.push({
      repo: {
        owner: pullRequest.repoOwner,
        name: pullRequest.repoName
      },
      number: pullRequest.pullRequestNumber,
      until: {
        kind: "next-update",
        mutedAtTimestamp: Date.now()
      }
    });
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
    await this.store.notifiedPullRequests.save(
      Array.from(this.notifiedPullRequestUrls)
    );
  }

  private async saveError(error: string | null) {
    this.lastError = error;
    await this.store.lastError.save(error);
    this.updateBadge();
  }

  private async saveLoadedState(lastCheck: LoadedState | null) {
    this.loadedState = lastCheck;
    await this.store.lastCheck.save(lastCheck);
  }

  private async saveMuteConfiguration(muteConfiguration: MuteConfiguration) {
    this.muteConfiguration = muteConfiguration;
    await this.store.muteConfiguration.save(muteConfiguration);
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
    this.badger.update(badgeState);
  }

  private triggerBackgroundRefresh() {
    this.chromeApi.runtime.sendMessage({
      kind: "refresh"
    });
  }

  private triggerReload() {
    this.chromeApi.runtime.sendMessage({
      kind: "reload"
    });
  }
}
