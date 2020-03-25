import {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListCommitsResponse,
  PullsListReviewsResponseItem as IncompletePullsListReviewsResponseItem,
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
   * Returns the full list of pull requests matching a given query.
   */
  searchPullRequests(query: string): Promise<PullsSearchResponse>;

  /**
   * Returns the details of a pull request.
   */
  loadPullRequestDetails(pr: PullRequestReference): Promise<PullsGetResponse>;

  /**
   * Returns the full list of reviews for a pull request.
   */
  loadReviews(pr: PullRequestReference): Promise<PullsListReviewsResponse>;

  /**
   * Returns the full list of comments for a pull request.
   */
  loadComments(pr: PullRequestReference): Promise<IssuesListCommentsResponse>;

  /**
   * Returns the full list of commits for a pull request.
   */
  loadCommits(pr: PullRequestReference): Promise<PullsListCommitsResponse>;
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

export type PullsListReviewsResponse = PullsListReviewsResponseItem[];

// PullsListReviewsResponseItem provides in @octokit/rest isn't specific enough
// about state and lacks fields such as submitted_at.
export interface PullsListReviewsResponseItem
  extends IncompletePullsListReviewsResponseItem {
  state: ReviewState;
  submitted_at: string;
}

export type PullsSearchResponse = PullsSearchResponseItem[];

export interface PullsSearchResponseItem {
  node_id: string;
  created_at: string;
  updated_at: string;
  title: string;
  number: number;
  draft: boolean;
  user: {
    login: string;
    avatar_url: string;
  };
  html_url: string;
  /**
   * Example of repository URL: "https://api.github.com/repos/airtasker/spot"
   */
  repository_url: string;
}
