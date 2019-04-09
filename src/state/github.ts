import Octokit from "@octokit/rest";
import { computed, observable } from "mobx";
import { showNotificationForNewPullRequests } from "../background/notifications";
import { BadgeState, updateBadge } from "../badge";
import { chromeApi } from "../chrome";
import { loadRepos } from "../github/api/repos";
import { loadAuthenticatedUser } from "../github/api/user";
import { isReviewNeeded } from "./filtering/review-needed";
import { refreshOpenPullRequests } from "./loading/pull-requests";
import { loadAllReviews } from "./loading/reviews";
import { lastErrorStorage } from "./storage/error";
import {
  LastCheck,
  lastCheckStorage,
  PullRequest,
  pullRequestFromResponse,
  repoFromResponse
} from "./storage/last-check";
import {
  MuteConfiguration,
  muteConfigurationStorage,
  NOTHING_MUTED
} from "./storage/mute";
import { notifiedPullRequestsStorage } from "./storage/notified-pull-requests";
import { tokenStorage } from "./storage/token";

export class GitHubState {
  octokit: Octokit | null = null;

  @observable overallStatus: "loading" | "loaded" = "loading";
  @observable refreshing: boolean = false;
  @observable token: string | null = null;
  @observable lastCheck: LastCheck | null = null;
  @observable muteConfiguration = NOTHING_MUTED;
  @observable notifiedPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  constructor() {
    chromeApi.runtime.onMessage.addListener(message => {
      console.debug("Message received", message);
      if (message.kind === "reload") {
        this.load();
      }
    });
  }

  async load() {
    this.token = await tokenStorage.load();
    this.lastError = await lastErrorStorage.load();
    this.overallStatus = "loading";
    try {
      if (this.token !== null) {
        this.octokit = new Octokit({
          auth: `token ${this.token}`
        });
        this.lastCheck = await lastCheckStorage.load();
        this.notifiedPullRequestUrls = new Set(
          await notifiedPullRequestsStorage.load()
        );
        this.muteConfiguration = await muteConfigurationStorage.load();
      } else {
        this.token = null;
        this.octokit = null;
        this.lastCheck = null;
        this.notifiedPullRequestUrls = new Set();
        this.muteConfiguration = NOTHING_MUTED;
      }
    } catch (e) {
      console.error(e);
      this.setError(e.message);
    }
    this.overallStatus = "loaded";
    this.updateBadge();
  }

  async setError(error: string | null) {
    this.lastError = error;
    await lastErrorStorage.save(error);
    this.updateBadge();
  }

  async setNewToken(token: string) {
    this.token = token;
    await tokenStorage.save(token);
    await this.setError(null);
    await this.setNotifiedPullRequests([]);
    await this.setLastCheck(null);
    await this.setMuteConfiguration(NOTHING_MUTED);
    await this.load();
    this.triggerBackgroundRefresh();
  }

  async setNotifiedPullRequests(pullRequests: PullRequest[]) {
    this.notifiedPullRequestUrls = new Set(pullRequests.map(p => p.htmlUrl));
    await notifiedPullRequestsStorage.save(
      Array.from(this.notifiedPullRequestUrls)
    );
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
      const user = await loadAuthenticatedUser(octokit);
      const repos = await loadRepos(octokit).then(r => r.map(repoFromResponse));
      const openPullRequests = await refreshOpenPullRequests(
        octokit,
        repos,
        this.lastCheck
      );
      const reviewsPerPullRequest = await loadAllReviews(
        octokit,
        openPullRequests
      );
      await this.setLastCheck({
        userLogin: user.login,
        openPullRequests: openPullRequests.map(pr =>
          pullRequestFromResponse(pr, reviewsPerPullRequest[pr.node_id])
        ),
        repos
      });
      const unreviewedPullRequests = this.unreviewedPullRequests || [];
      await showNotificationForNewPullRequests(
        unreviewedPullRequests,
        this.notifiedPullRequestUrls
      );
      await this.setNotifiedPullRequests(unreviewedPullRequests);
      this.updateBadge();
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
    await this.setMuteConfiguration(this.muteConfiguration);
    this.updateBadge();
  }

  @computed
  get unreviewedPullRequests(): PullRequest[] | null {
    const lastCheck = this.lastCheck;
    if (!lastCheck || !lastCheck.userLogin) {
      return null;
    }
    return lastCheck.openPullRequests.filter(pr =>
      isReviewNeeded(pr, lastCheck.userLogin!, this.muteConfiguration)
    );
  }

  private async setLastCheck(lastCheck: LastCheck | null) {
    this.lastCheck = lastCheck;
    await lastCheckStorage.save(lastCheck);
  }

  private async setMuteConfiguration(muteConfiguration: MuteConfiguration) {
    this.muteConfiguration = muteConfiguration;
    await muteConfigurationStorage.save(muteConfiguration);
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
    updateBadge(badgeState);
  }

  private triggerBackgroundRefresh() {
    chromeApi.runtime.sendMessage({
      kind: "refresh"
    });
  }

  private triggerReload() {
    chromeApi.runtime.sendMessage({
      kind: "reload"
    });
  }
}
