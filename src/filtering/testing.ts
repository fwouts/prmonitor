import { Context } from "../environment/api";
import { PullRequest } from "../storage/loaded-state";
import { Filter, filterPullRequests } from "./filters";

export function getFilteredBucket(
  _context: Context,
  userLogin: string,
  pr: PullRequest
) {
  const filteredPullRequests = filterPullRequests(
    userLogin,
    [pr],
  );
  const filters: Filter[] = [];
  if (filteredPullRequests.needsReview.length > 0) {
    filters.push(Filter.NEEDS_REVIEW);
  }
  if (filteredPullRequests.mine.length > 0) {
    filters.push(Filter.MINE);
  }
  return filters;
}
