import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { EnrichedPullRequest } from "./enriched-pull-request";
import { isMuted, MutedResult } from "./muted";
import {
  isReviewRequired,
  pullRequestStatus,
  PullRequestStatus
} from "./status";

export enum Filter {
  /**
   * Filter that only shows pull requests that need a review (either because
   * they are new, or they have been updated since the last review), ignoring
   * any muted PRs unless they no longer match the muting criteria.
   */
  INCOMING = "incoming",

  /**
   * Filter that shows pull requests that need a review but have been muted.
   */
  MUTED = "muted",

  /**
   * Filter that shows open pull requests that have already been reviewed.
   */
  REVIEWED = "reviewed",

  /**
   * Filter that shows the user's own open pull requests.
   */
  MINE = "mine"
}

export type FilteredPullRequests = {
  [filter in Filter]: EnrichedPullRequest[];
};

export function filterPullRequests(
  userLogin: string,
  openPullRequests: PullRequest[],
  muteConfiguration: MuteConfiguration
): FilteredPullRequests {
  const enrichedPullRequests = openPullRequests.map(pr => ({
    status: pullRequestStatus(pr, userLogin),
    ...pr
  }));
  return {
    incoming: enrichedPullRequests.filter(
      pr =>
        isReviewRequired(pr.status) &&
        isMuted(pr, muteConfiguration) === MutedResult.VISIBLE
    ),
    muted: enrichedPullRequests.filter(
      pr =>
        isReviewRequired(pr.status) &&
        isMuted(pr, muteConfiguration) === MutedResult.MUTED
    ),
    reviewed: enrichedPullRequests.filter(
      pr => pr.status === PullRequestStatus.INCOMING_REVIEWED_PENDING_REPLY
    ),
    mine: enrichedPullRequests.filter(pr => pr.author.login === userLogin)
  };
}
