import { storage } from "./helper";

/**
 * Storage of the time we last checked for pull requests.
 */
export const lastCheckTimeStorage = storage<string>("lastCheckTime");

export interface LastCheck {
  /**
   * The list of all opened pull requests across all repositories.
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
  openedPullRequests: PullRequest[];

  /**
   * The most recent `pushed_at` value seen across all repositories (ie the first one, since
   * we order repositories in decreasing order).
   *
   * This allows us to know which repositories have not been pushed since the last check.
   * Note that this also implies that there was no pull request either, because GitHub updates
   * the `pushed_at` value when a pull request is created (likely because they automatically
   * create an associated branch).
   *
   * This will be `null` when there were no repositories in the last check.
   */
  maximumPushedAt: string | null;
}

export interface PullRequest {
  owner: string;
  name: string;
  pullRequestId: number;
}
