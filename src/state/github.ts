import Octokit from "@octokit/rest";
import { computed, observable } from "mobx";
import { chromeApi } from "../chrome";
import { loadRepos } from "../github/api/repos";
import {
  GetAuthenticatedUserResponse,
  loadAuthenticatedUser
} from "../github/api/user";
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

  @observable status: "loading" | "loaded" | "failed" = "loading";
  @observable token: string | null = null;
  @observable user: GetAuthenticatedUserResponse | null = null;
  @observable lastCheck: LastCheck | null = null;
  @observable muteConfiguration = NOTHING_MUTED;
  @observable notifiedPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  async start() {
    const token = await tokenStorage.load();
    this.lastError = await lastErrorStorage.load();
    await this.load(token);
  }

  async setError(error: string | null) {
    this.lastError = error;
    await lastErrorStorage.save(error);
  }

  async setNewToken(token: string) {
    this.token = token;
    await tokenStorage.save(token);
    await this.setError(null);
    await this.setNotifiedPullRequests([]);
    await this.setLastCheck(null);
    await this.setMuteConfiguration(NOTHING_MUTED);
    await this.load(token);
    if (this.status === "loaded") {
      await this.refreshPullRequests();
    }
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
      throw new Error(`Not authenticated.`);
    }
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
      openPullRequests: openPullRequests.map(pr =>
        pullRequestFromResponse(pr, reviewsPerPullRequest[pr.node_id])
      ),
      repos
    });
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
    this.triggerBackgroundRefresh();
  }

  @computed
  get unreviewedPullRequests(): PullRequest[] | null {
    if (!this.lastCheck || !this.user) {
      return null;
    }
    const userLogin = this.user.login;
    return this.lastCheck.openPullRequests.filter(pr =>
      isReviewNeeded(pr, userLogin, this.muteConfiguration)
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

  private async load(token: string | null) {
    this.status = "loading";
    try {
      if (token !== null) {
        this.token = token;
        this.octokit = new Octokit({
          auth: `token ${token}`
        });
        this.user = await loadAuthenticatedUser(this.octokit);
        this.lastCheck = await lastCheckStorage.load();
        this.notifiedPullRequestUrls = new Set(
          await notifiedPullRequestsStorage.load()
        );
        this.muteConfiguration = await muteConfigurationStorage.load();
      } else {
        this.token = null;
        this.octokit = null;
        this.user = null;
        this.lastCheck = null;
        this.notifiedPullRequestUrls = new Set();
        this.muteConfiguration = NOTHING_MUTED;
      }
      this.status = "loaded";
    } catch (e) {
      console.error(e);
      this.status = "failed";
      this.setError(e.message);
    }
  }

  private triggerBackgroundRefresh() {
    chromeApi.runtime.sendMessage({
      kind: "refresh"
    });
  }
}
