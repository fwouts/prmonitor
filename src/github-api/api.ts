import {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListResponse,
  PullsListReviewsResponseItem as IncompletePullsListReviewsResponseItem,
  ReposGetResponse
} from "@octokit/rest";
import { ReviewState } from "../storage/loaded-state";

/**
 * A simple wrapper around GitHub's API.
 */
export interface GitHubApi {
  /**
   * Returns the information about the current authenticated user.
   */
  loadAuthenticatedUser(): Promise<GetAuthenticatedUserResponse>;

  /**
   * Returns the full list of repositories for the user.
   */
  loadRepos(): Promise<ReposListResponse>;

  /**
   * Returns the full list of pull requests in a given state for a repository.
   */
  loadPullRequests(
    repo: RepoReference,
    state: "open" | "closed" | "all"
  ): Promise<PullsListResponse>;

  /**
   * Returns a single pull request.
   */
  loadSinglePullRequest(pr: PullRequestReference): Promise<PullsGetResponse>;

  /**
   * Returns the full list of reviews for a pull request.
   */
  loadReviews(pr: PullRequestReference): Promise<PullsListReviewsResponse>;

  /**
   * Returns the full list of comments for a pull request.
   */
  loadComments(pr: PullRequestReference): Promise<IssuesListCommentsResponse>;
}

export interface RepoReference {
  owner: string;
  name: string;
}

export interface PullRequestReference {
  repo: RepoReference;
  number: number;
}

// Missing or incomplete types from @octokit/rest.

export interface GetAuthenticatedUserResponse {
  login: string;
}

export type ReposListResponse = ReposGetResponse[];

export type PullsListReviewsResponse = PullsListReviewsResponseItem[];

// PullsListReviewsResponseItem provides in @octokit/rest isn't specific enough
// about state and lacks fields such as submitted_at.
export interface PullsListReviewsResponseItem
  extends IncompletePullsListReviewsResponseItem {
  state: ReviewState;
  submitted_at: string;
}
