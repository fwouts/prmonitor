import { Environment } from "../environment/api";
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
  env: Environment,
  userLogin: string,
  openPullRequests: PullRequest[],
  muteConfiguration: MuteConfiguration
): FilteredPullRequests {
  const enrichedPullRequests = openPullRequests.map((pr) => ({
    state: pullRequestState(pr, userLogin),
    ...pr,
  }));
  const ignoreNewCommits = !!muteConfiguration.ignoreNewCommits;
  return {
    incoming: enrichedPullRequests.filter(
      (pr) =>
        isReviewRequired(pr.state, ignoreNewCommits) &&
        isMuted(env, pr, muteConfiguration) === MutedResult.VISIBLE
    ),
    muted: enrichedPullRequests.filter(
      (pr) =>
        isReviewRequired(pr.state, ignoreNewCommits) &&
        isMuted(env, pr, muteConfiguration) === MutedResult.MUTED
    ),
    reviewed: enrichedPullRequests.filter(
      (pr) =>
        pr.state.kind === "incoming" &&
        !pr.state.newReviewRequested &&
        !pr.state.newCommit &&
        !pr.state.authorResponded
    ),
    mine: enrichedPullRequests.filter((pr) => pr.author.login === userLogin),
    ignored: enrichedPullRequests.filter(
      (pr) => isMuted(env, pr, muteConfiguration) === MutedResult.INVISIBLE
    ),
  };
}
