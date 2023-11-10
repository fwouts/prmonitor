import { PullRequest } from "../storage/loaded-state";
import { EnrichedPullRequest } from "./enriched-pull-request";
import { isReviewRequired, pullRequestState } from "./status";

export enum Filter {
  ALL = "all",
  MINE = "mine",
  NEEDS_REVIEW = "needsReview",
  NEEDS_REVISION ="needsRevision",
}

export type FilteredPullRequests = {
  [filter in Filter]: EnrichedPullRequest[];
};

export function filterPullRequests(
  userLogin: string,
  openPullRequests: PullRequest[],
): FilteredPullRequests {
  const enrichedPullRequests = openPullRequests.map((pr) => ({
    state: pullRequestState(pr, userLogin),
    ...pr,
  }));

  const mine = enrichedPullRequests.filter(
    (pr) => pr.author?.login === userLogin
  );
  const needsReview = enrichedPullRequests.filter(
    (pr) => isReviewRequired(pr.state) && userLogin !== pr.author?.login
  );
  const needsRevision = enrichedPullRequests.filter(
    (pr) => !isReviewRequired(pr.state) && userLogin !== pr.author?.login
  );
  const all = [...mine, ...needsReview, ...needsRevision];

  return {
    all,
    mine,
    needsReview,
    needsRevision,
  };
}
