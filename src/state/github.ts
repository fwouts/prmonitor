import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { PullRequest } from "../github/api/pull-requests";
import { loadRepos } from "../github/api/repos";
import { loadAuthenticatedUser, User } from "../github/api/user";
import { loadErrorFromStorage, saveErrorToStorage } from "./storage/error";
import {
  loadLastSeenPullRequestsUrlsFromStorage,
  loadUnreviewedPullRequestsFromStorage,
  saveSeenPullRequestsToStorage,
  saveUnreviewedPullRequestsToStorage
} from "./storage/pull-requests";
import {
  loadRepoListFromStorage,
  RepoSummary,
  saveRepoListToStorage
} from "./storage/repos";
import {
  loadApiTokenFromStorage,
  saveApiTokenToStorage
} from "./storage/token";

/**
 * Repos should be cached for at most 30 minutes.
 */
const MAX_REPOS_AGE_MILLIS = 30 * 60 * 1000;

export class GitHubState {
  @observable status: "loading" | "loaded" = "loading";
  @observable token: string | null = null;
  @observable user: User | null = null;
  @observable repoList: RepoSummary[] | null = null;
  @observable unreviewedPullRequests: PullRequest[] | null = null;
  @observable lastSeenPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  async start() {
    const token = await loadApiTokenFromStorage();
    this.lastError = await loadErrorFromStorage();
    await this.load(token);
  }

  async setError(error: string | null) {
    this.lastError = error;
    await saveErrorToStorage(error);
  }

  async setNewToken(token: string) {
    this.token = token;
    await saveApiTokenToStorage(token);
    await this.setError(null);
    await this.load(token);
  }

  async setUnreviewedPullRequests(pullRequests: PullRequest[]) {
    this.unreviewedPullRequests = pullRequests;
    await saveUnreviewedPullRequestsToStorage(pullRequests);
  }

  async setLastSeenPullRequests(pullRequests: PullRequest[]) {
    this.lastSeenPullRequestUrls = new Set(pullRequests.map(p => p.html_url));
    await saveSeenPullRequestsToStorage(this.lastSeenPullRequestUrls);
  }

  private async load(token: string | null) {
    this.status = "loading";
    if (token) {
      this.token = token;
      const octokit = new Octokit({
        auth: `token ${token}`
      });
      this.user = await loadAuthenticatedUser(octokit);
      this.repoList = await this.loadRepoList(octokit);
      this.unreviewedPullRequests = await loadUnreviewedPullRequestsFromStorage();
      this.lastSeenPullRequestUrls = await loadLastSeenPullRequestsUrlsFromStorage();
    } else {
      this.token = null;
      this.user = null;
      this.unreviewedPullRequests = null;
      this.lastSeenPullRequestUrls = new Set();
    }
    this.status = "loaded";
  }

  private async loadRepoList(octokit: Octokit): Promise<RepoSummary[]> {
    const repoListStorage = await loadRepoListFromStorage();
    let repoList;
    if (
      repoListStorage &&
      repoListStorage.timestamp > Date.now() - MAX_REPOS_AGE_MILLIS
    ) {
      repoList = repoListStorage.list;
    } else {
      const fullRepoList = await loadRepos(octokit);
      repoList = fullRepoList.map(repo => ({
        owner: repo.owner.login,
        name: repo.name
      }));
      await saveRepoListToStorage({
        timestamp: Date.now(),
        list: repoList
      });
    }
    return repoList;
  }
}
