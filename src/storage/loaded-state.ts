export interface LoadedState {
  // TODO: Make it required once the field has been populated for long enough.
  userLogin?: string;

  /**
   * The list of all repositories that the user is a member of.
   */
  repos: Repo[];

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

export interface PullRequest {
  nodeId: string;
  htmlUrl: string;
  repoOwner: string;
  repoName: string;
  pullRequestNumber: number;
  /**
   * The last time the PR has been updated. This changes every time a new review
   * or comment is added, so when it doesn't change, we know not to reload them.
   */
  // TODO: Make required in May 2019.
  updatedAt?: string;
  // TODO: Remove in May 2019 (deprecated in favour of author object).
  authorLogin: string;
  // TODO: Make required in May 2019.
  author?: {
    login: string;
    avatarUrl: string;
  };
  title: string;
  requestedReviewers: string[];
  reviews: Review[];
  // TODO: Make required in May 2019.
  comments?: Comment[];
}

export interface Comment {
  authorLogin: string;
  createdAt: string;
}

export interface Review {
  authorLogin: string;
  state: ReviewState;
  submittedAt: string;
}

export type ReviewState =
  | "PENDING"
  | "COMMENTED"
  | "CHANGES_REQUESTED"
  | "APPROVED";
