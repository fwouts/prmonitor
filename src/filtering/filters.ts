import { Context } from "../environment/api";
import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { EnrichedPullRequest } from "./enriched-pull-request";
import { isMuted, MutedResult } from "./muted";
import { isReviewRequired, pullRequestState } from "./status";

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
  MINE = "mine",

  /**
   * Filter that contains ignored PRs.
   */
  IGNORED = "ignored",
}

export type FilteredPullRequests = {
  [filter in Filter]: EnrichedPullRequest[];
};

export function filterPullRequests(
  context: Context,
  userLogin: string,
  openPullRequests: PullRequest[],
  muteConfiguration: MuteConfiguration
): FilteredPullRequests {
  const enrichedPullRequests = openPullRequests.map((pr) => ({
    state: pullRequestState(pr, userLogin),
    ...pr,
  }));
  const notifyNewCommits = !!muteConfiguration.notifyNewCommits;
  const onlyDirectRequests = !!muteConfiguration.onlyDirectRequests;
  const whitelistedTeams = muteConfiguration.whitelistedTeams || [];
  return {
    incoming: enrichedPullRequests.filter(
      (pr) =>
        isReviewRequired(
          pr.state,
          notifyNewCommits,
          onlyDirectRequests,
          whitelistedTeams
        ) && isMuted(context, pr, muteConfiguration) === MutedResult.VISIBLE
    ),
    muted: enrichedPullRequests.filter(
      (pr) =>
        isReviewRequired(
          pr.state,
          notifyNewCommits,
          onlyDirectRequests,
          whitelistedTeams
        ) && isMuted(context, pr, muteConfiguration) === MutedResult.MUTED
    ),
    reviewed: enrichedPullRequests.filter(
      (pr) =>
        pr.state.kind === "incoming" &&
        !pr.state.newReviewRequested &&
        (!pr.state.newCommit || !notifyNewCommits) &&
        !pr.state.authorResponded
    ),
    mine: enrichedPullRequests.filter((pr) => pr.author?.login === userLogin),
    ignored: enrichedPullRequests.filter(
      (pr) => isMuted(context, pr, muteConfiguration) === MutedResult.INVISIBLE
    ),
  };
}
