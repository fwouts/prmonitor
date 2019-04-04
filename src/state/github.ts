import Octokit, {
  PullsGetResponse,
  PullsListResponseItem,
  ReposGetResponse
} from "@octokit/rest";
import { computed, observable } from "mobx";
import { loadPullRequest, loadPullRequests } from "../github/api/pull-requests";
import { loadRepos, ReposListResponse } from "../github/api/repos";
import { loadReviews, PullsListReviewsResponse } from "../github/api/reviews";
import {
  GetAuthenticatedUserResponse,
  loadAuthenticatedUser
} from "../github/api/user";
import { repoWasPushedAfter } from "./filtering/repos-pushed-after";
import { isReviewNeeded } from "./filtering/review-needed";
import { lastErrorStorage } from "./storage/error";
import {
  LastCheck,
  lastCheckStorage,
  PullRequest,
  pullRequestFromResponse
} from "./storage/last-check";
import { seenPullRequestsUrlsStorage } from "./storage/pull-requests";
import { tokenStorage } from "./storage/token";

export class GitHubState {
  octokit: Octokit | null = null;

  @observable status: "loading" | "loaded" = "loading";
  @observable token: string | null = null;
  @observable user: GetAuthenticatedUserResponse | null = null;
  @observable repoList: ReposGetResponse[] | null = null;
  @observable lastCheck: LastCheck | null = null;
  @observable lastSeenPullRequestUrls = new Set<string>();
  @observable lastError: string | null = null;

  async start() {
    const token = await tokenStorage.load();
    this.lastError = await lastErrorStorage.load();
    await this.load(token);
    await this.refreshPullRequests();
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
    if (!this.repoList) {
      throw new Error(`Repo list has not been loaded yet.`);
    }
    const openPullRequests = await refreshOpenPullRequests(
      octokit,
      this.repoList,
      this.lastCheck
    );
    const reviews = await Promise.all(
      openPullRequests.map(
        async (
          pr
        ): Promise<[string /* node ID */, PullsListReviewsResponse]> => [
          pr.node_id,
          await loadReviews(
            octokit,
            pr.base.repo.owner.login,
            pr.base.repo.name,
            pr.number
          )
        ]
      )
    );
    const reviewsPerPullRequest = reviews.reduce<{
      [pullRequestNodeId: string]: PullsListReviewsResponse;
    }>((acc, [nodeId, reviews]) => {
      acc[nodeId] = reviews;
      return acc;
    }, {});

    // For each pull request, check:
    // - author (is current user or not)
    // - date of last review by current user
    // - date of last update
    //
    // Then use that information at display time to know what to show.
    this.lastCheck = {
      openPullRequests: openPullRequests.map(pr =>
        pullRequestFromResponse(pr, reviewsPerPullRequest[pr.node_id])
      ),
      maximumPushedAt: this.repoList[0] ? this.repoList[0].pushed_at : null
    };
    lastCheckStorage.save(this.lastCheck);
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

  private async load(token: string | null) {
    this.status = "loading";
    if (token) {
      this.token = token;
      this.octokit = new Octokit({
        auth: `token ${token}`
      });
      this.user = await loadAuthenticatedUser(this.octokit);
      this.repoList = await loadRepos(this.octokit);
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
  }
}

/**
 * Refreshes the list of pull requests for a list of repositories, optimizing
 * for the minimum number of API requests to GitHub as brute-forcing would
 * quickly go over API rate limits if the user has several hundred repositories
 * or many pull requests opened.
 */
export async function refreshOpenPullRequests(
  octokit: Octokit,
  repoList: ReposListResponse,
  lastCheck: LastCheck | null
): Promise<Array<PullsListResponseItem | PullsGetResponse>> {
  // Look for new pull requests in repos that have been recently pushed.
  const reposWithPotentiallyNewPullRequests = repoList.filter(
    repoWasPushedAfter(lastCheck ? lastCheck.maximumPushedAt : null)
  );

  // For each recently pushed repo, load all open pull requests.
  const openPullRequests: Array<
    PullsListResponseItem | PullsGetResponse
  > = (await Promise.all(
    reposWithPotentiallyNewPullRequests.map(repo =>
      loadPullRequests(octokit, repo.owner.login, repo.name, "open")
    )
  )).flat();

  // Make sure not to do redundant work in the upcoming loop.
  const alreadyLoadedPullRequestNodeIds = new Set(
    openPullRequests.map(pr => pr.node_id)
  );

  // Also update the status of every other known pull request.
  if (lastCheck) {
    const updatedPullRequests = await Promise.all(
      lastCheck.openPullRequests
        .filter(pr => !alreadyLoadedPullRequestNodeIds.has(pr.nodeId))
        .map(pr =>
          loadPullRequest(
            octokit,
            pr.repoOwner,
            pr.repoName,
            pr.pullRequestNumber
          )
        )
    );
    openPullRequests.push(
      ...updatedPullRequests.filter(pr => pr.state === "open")
    );
  }

  return openPullRequests;
}
