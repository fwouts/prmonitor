import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { getLastAuthorUpdateTimestamp } from "./timestamps";

/**
 * Returns whether the pull request is muted.
 */
export function isMuted(pr: PullRequest, muteConfiguration: MuteConfiguration) {
  for (const muted of muteConfiguration.mutedPullRequests) {
    if (
      muted.repo.owner === pr.repoOwner &&
      muted.repo.name === pr.repoName &&
      muted.number === pr.pullRequestNumber
    ) {
      // It's a match.
      switch (muted.until.kind) {
        case "next-update":
          const updatedSince =
            getLastAuthorUpdateTimestamp(pr) > muted.until.mutedAtTimestamp;
          return !updatedSince;
      }
    }
  }
  return false;
}
