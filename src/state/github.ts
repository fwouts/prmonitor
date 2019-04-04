import Octokit from "@octokit/rest";
import { computed, observable } from "mobx";
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
import { seenPullRequestsUrlsStorage } from "./storage/pull-requests";
import { tokenStorage } from "./storage/token";

export class GitHubState {
  octokit: Octokit | null = null;

  @observable status: "loading" | "loaded" | "failed" = "loading";
  @observable token: string | null = null;
  @observable user: GetAuthenticatedUserResponse | null = null;
  @observable lastCheck: LastCheck | null = null;
  @observable lastSeenPullRequestUrls = new Set<string>();
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
    await this.setLastSeenPullRequests([]);
    await this.setLastCheck(null);
    await this.load(token);
    if (this.status === "loaded") {
      await this.refreshPullRequests();
    }
  }

  async setLastSeenPullRequests(pullRequests: PullRequest[]) {
    this.lastSeenPullRequestUrls = new Set(pullRequests.map(p => p.htmlUrl));
    await seenPullRequestsUrlsStorage.save(
      Array.from(this.lastSeenPullRequestUrls)
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

  @computed
  get unreviewedPullRequests(): PullRequest[] | null {
    if (!this.lastCheck || !this.user) {
      return null;
    }
    const userLogin = this.user.login;
    return this.lastCheck.openPullRequests.filter(pr =>
      isReviewNeeded(pr, userLogin)
    );
  }

  private async setLastCheck(lastCheck: LastCheck | null) {
    this.lastCheck = lastCheck;
    await lastCheckStorage.save(lastCheck);
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
        this.lastSeenPullRequestUrls = new Set(
          await seenPullRequestsUrlsStorage.load()
        );
      } else {
        this.token = null;
        this.octokit = null;
        this.user = null;
        this.lastCheck = null;
        this.lastSeenPullRequestUrls = new Set();
      }
      this.status = "loaded";
    } catch (e) {
      console.error(e);
      this.status = "failed";
      this.setError(e.message);
    }
  }
}
