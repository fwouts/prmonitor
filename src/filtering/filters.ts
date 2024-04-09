import { PullRequest } from "../storage/loaded-state";
import { EnrichedPullRequest } from "./enriched-pull-request";
import { PullRequestState, pullRequestState } from "./status";

export enum Filter {
  ALL = "all",
  MINE = "mine",
  NEEDS_REVIEW = "needsReview",
  NEEDS_REVISION = "needsRevision",
  RECENTLY_MERGED = "recentlyMerged",
}

export type FilteredPullRequests = {
  [filter in Filter]: EnrichedPullRequest[];
};

export function filterPullRequests(
  userLogin: string,
  openPullRequests: PullRequest[]
): FilteredPullRequests {
  const enrichedPullRequests = openPullRequests.map((pr) => ({
    state: pullRequestState(pr, userLogin),
    ...pr,
  }));

  const mine = enrichedPullRequests.filter(
    (pr) => pr.author?.login === userLogin && !pr.isMerged
  );
  const recentlyMerged = enrichedPullRequests.filter(
    (pr) => pr.author?.login === userLogin && pr.isMerged
  );
  const needsReview = enrichedPullRequests.filter(
    (pr) => userLogin !== pr.author?.login && !areChangesRequested(pr.state)
  );
  const needsRevision = enrichedPullRequests.filter(
    (pr) => userLogin !== pr.author?.login && areChangesRequested(pr.state)
  );
  const all = [...mine, ...recentlyMerged, ...needsReview, ...needsRevision];

  return {
    all,
    mine,
    needsReview,
    needsRevision,
    recentlyMerged,
  };
}

function areChangesRequested(state: PullRequestState) {
  switch (state.kind) {
    case "incoming":
    case "outgoing":
      return state.changesRequested;
    default:
      return false;
  }
}
