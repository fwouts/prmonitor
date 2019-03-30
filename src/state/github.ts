import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { PullRequest } from "../github/api/pull-requests";
import { loadAuthenticatedUser, User } from "../github/api/user";
import { loadErrorFromStorage, saveErrorToStorage } from "./storage/error";
import {
  loadLastSeenPullRequestsUrlsFromStorage,
  loadUnreviewedPullRequestsFromStorage,
  saveSeenPullRequestsToStorage,
  saveUnreviewedPullRequestsToStorage
} from "./storage/pull-requests";
import {
  loadApiTokenFromStorage,
  saveApiTokenToStorage
} from "./storage/token";

export class GitHubState {
  private octokit: Octokit | null = null;

  @observable tokenValue: TokenValue = {
    kind: "loading"
  };
  @observable user: User | null = null;
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
    this.tokenValue = {
      kind: "provided",
      token
    };
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
    if (token) {
      this.tokenValue = {
        kind: "provided",
        token
      };
      this.octokit = new Octokit({
        auth: `token ${token}`
      });
      this.user = await loadAuthenticatedUser(this.octokit);
      this.unreviewedPullRequests = await loadUnreviewedPullRequestsFromStorage();
      this.lastSeenPullRequestUrls = await loadLastSeenPullRequestsUrlsFromStorage();
    } else {
      this.tokenValue = {
        kind: "missing"
      };
      this.user = null;
      this.unreviewedPullRequests = null;
      this.lastSeenPullRequestUrls = new Set();
    }
  }
}

export type TokenValue =
  | {
      kind: "loading";
    }
  | {
      kind: "provided";
      token: string;
    }
  | {
      kind: "missing";
    };
