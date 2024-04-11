import {
  CheckStatus,
  PullRequestReference,
  ReviewDecision,
} from "../github-api/api";

export interface LoadedState {
  /**
   * The timestamp at which we started loading the state.
   *
   * Note that since loading the state can take a few minutes, this can be quite
   * different from the end time.
   */
  startRefreshTimestamp?: number;

  userLogin: string;

  /**
   * The list of all open pull requests across all repositories.
   *
   * This includes pull requests that the user isn't involved in (yet). We will check the
   * status of each pull request to see whether its status has changed, or whether the user
   * is now involved (e.g. by being added as a reviewer).
   *
   * This is important because a repository's `pushed_at` field does not get updated when a
   * new comment has been added to a pull request, whereas it does change when a pull request
   * is created. This allows us to only ever look for new pull requests in repositories that
   * where `pushed_at` has changed since our last check.
   */
  openPullRequests: PullRequest[];
}

export interface Repo {
  owner: string;
  name: string;

  /** Date when the last commit was pushed (across any branch). */
  pushedAt: string;
}

export function ref(pullRequest: PullRequest): PullRequestReference {
  return {
    repo: {
      owner: pullRequest.repoOwner,
      name: pullRequest.repoName,
    },
    number: pullRequest.pullRequestNumber,
  };
}

export interface PullRequest {
  nodeId: string;
  htmlUrl: string;
  repoOwner: string;
  repoName: string;
  pullRequestNumber: number;
  updatedAt: string;
  author: {
    login: string;
    avatarUrl: string;
  } | null;
  changeSummary: {
    changedFiles: number;
    additions: number;
    deletions: number;
  };
  title: string;
  draft?: boolean;
  /**
   * Whether a review is requested from the current user.
   */
  reviewRequested: boolean;
  /**
   * List of reviewers who are yet to review the PR (or who were requested to review again).
   */
  // TODO: Make this required in September 2019.
  requestedReviewers?: string[];
  requestedTeams?: string[];
  reviews: Review[];
  comments: Comment[];

  reviewDecision: ReviewDecision;
  checkStatus?: CheckStatus;
  isMerged: boolean;
}

export interface Comment {
  authorLogin: string;
  createdAt: string;
}

export interface Review {
  authorLogin: string;
  state: ReviewState;
  submittedAt?: string;
}

export interface Commit {
  authorLogin: string;
  createdAt?: string;
}

export type ReviewState =
  | "PENDING"
  | "COMMENTED"
  | "CHANGES_REQUESTED"
  | "APPROVED";
