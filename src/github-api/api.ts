import {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListResponse,
  PullsListReviewsResponseItem as IncompletePullsListReviewsResponseItem,
  ReposGetResponse
} from "@octokit/rest";
import { ReviewState } from "../storage/loaded-state";

export interface GitHubApi {
  loadAuthenticatedUser(): Promise<GetAuthenticatedUserResponse>;

  loadRepos(): Promise<ReposListResponse>;

  loadPullRequests(
    repo: RepoReference,
    state: "open" | "closed" | "all"
  ): Promise<PullsListResponse>;

  loadSinglePullRequest(pr: PullRequestReference): Promise<PullsGetResponse>;

  loadReviews(pr: PullRequestReference): Promise<PullsListReviewsResponse>;

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
