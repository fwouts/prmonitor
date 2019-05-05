import assertNever from "assert-never";
import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { isMuted } from "./muted";
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

export type FilteredPullRequests = { [filter in Filter]: PullRequest[] };

export function filterPullRequests(
  userLogin: string,
  openPullRequests: PullRequest[],
  muteConfiguration: MuteConfiguration
): FilteredPullRequests {
  return {
    incoming: openPullRequests.filter(
      filterPredicate(userLogin, muteConfiguration, Filter.INCOMING)
    ),
    muted: openPullRequests.filter(
      filterPredicate(userLogin, muteConfiguration, Filter.MUTED)
    ),
    reviewed: openPullRequests.filter(
      filterPredicate(userLogin, muteConfiguration, Filter.REVIEWED)
    ),
    mine: openPullRequests.filter(
      filterPredicate(userLogin, muteConfiguration, Filter.MINE)
    )
  };
}

export function filterPredicate(
  userLogin: string,
  muteConfiguration: MuteConfiguration,
  filter: Filter
): (pr: PullRequest) => boolean {
  switch (filter) {
    case Filter.INCOMING:
      return pr =>
        isReviewRequired(pullRequestStatus(pr, userLogin)) &&
        !isMuted(pr, muteConfiguration);
    case Filter.MUTED:
      return pr =>
        isReviewRequired(pullRequestStatus(pr, userLogin)) &&
        isMuted(pr, muteConfiguration);
    case Filter.REVIEWED:
      return pr =>
        pullRequestStatus(pr, userLogin) ===
        PullRequestStatus.INCOMING_REVIEWED_PENDING_REPLY;
    case Filter.MINE:
      return pr => pr.author.login === userLogin;
    default:
      throw assertNever(filter);
  }
}
