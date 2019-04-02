import Octokit, {
  PullsListResponseItem,
  ReposGetResponse
} from "@octokit/rest";
import { observable } from "mobx";
import { loadRepos } from "../github/api/repos";
import {
  GetAuthenticatedUserResponse,
  loadAuthenticatedUser
} from "../github/api/user";
import { lastErrorStorage } from "./storage/error";
import {
  seenPullRequestsUrlsStorage,
  unreviewedPullRequestsStorage
} from "./storage/pull-requests";
import { tokenStorage } from "./storage/token";

export class GitHubState {
  octokit: Octokit | null = null;

  @observable status: "loading" | "loaded" = "loading";
  @observable token: string | null = null;
  @observable user: GetAuthenticatedUserResponse | null = null;
  @observable repoList: ReposGetResponse[] | null = null;
  @observable unreviewedPullRequests: PullsListResponseItem[] | null = null;
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
    await this.load(token);
  }

  async setUnreviewedPullRequests(pullRequests: PullsListResponseItem[]) {
    this.unreviewedPullRequests = pullRequests;
    await unreviewedPullRequestsStorage.save(pullRequests);
  }

  async setLastSeenPullRequests(pullRequests: PullsListResponseItem[]) {
    this.lastSeenPullRequestUrls = new Set(pullRequests.map(p => p.html_url));
    await seenPullRequestsUrlsStorage.save(
      Array.from(this.lastSeenPullRequestUrls)
    );
  }

  private async load(token: string | null) {
    this.status = "loading";
    if (token) {
      this.token = token;
      this.octokit = new Octokit({
        auth: `token ${token}`
      });
      this.user = await loadAuthenticatedUser(this.octokit);
      this.repoList = await loadRepos(this.octokit);
      console.log(JSON.parse(JSON.stringify(this.repoList)));
      this.unreviewedPullRequests = await unreviewedPullRequestsStorage.load();
      this.lastSeenPullRequestUrls = new Set(
        await seenPullRequestsUrlsStorage.load()
      );
    } else {
      this.token = null;
      this.octokit = null;
      this.user = null;
      this.unreviewedPullRequests = null;
      this.lastSeenPullRequestUrls = new Set();
    }
    this.status = "loaded";
  }
}
