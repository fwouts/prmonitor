import assertNever from "assert-never";
import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { isMuted } from "./muted";
import { isReviewNeeded } from "./review-needed";
import { userPreviouslyReviewed } from "./reviewed";

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

export function filter(
  userLogin: string,
  openPullRequests: PullRequest[],
  muteConfiguration: MuteConfiguration,
  filter: Filter
) {
  return openPullRequests.filter(
    filterPredicate(userLogin, muteConfiguration, filter)
  );
}

export function filterPredicate(
  userLogin: string,
  muteConfiguration: MuteConfiguration,
  filter: Filter
): (pr: PullRequest) => boolean {
  switch (filter) {
    case Filter.INCOMING:
      return pr =>
        isReviewNeeded(pr, userLogin) && !isMuted(pr, muteConfiguration);
    case Filter.MUTED:
      return pr =>
        isReviewNeeded(pr, userLogin) && isMuted(pr, muteConfiguration);
    case Filter.REVIEWED:
      return pr =>
        userPreviouslyReviewed(pr, userLogin) && !isReviewNeeded(pr, userLogin);
    case Filter.MINE:
      return pr => pr.authorLogin === userLogin;
    default:
      throw assertNever(filter);
  }
}
