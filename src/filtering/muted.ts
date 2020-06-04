import { Environment } from "../environment/api";
import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import {
  getLastAuthorCommentTimestamp,
  getLastAuthorUpdateTimestamp,
} from "./timestamps";

/**
 * Returns whether the pull request is muted.
 */
export function isMuted(
  env: Environment,
  pr: PullRequest,
  muteConfiguration: MuteConfiguration
): MutedResult {
  const currentTime = env.getCurrentTime();
  for (const [owner, ignoreConfiguration] of Object.entries(
    muteConfiguration.ignored || {}
  )) {
    if (pr.repoOwner !== owner) {
      continue;
    }
    switch (ignoreConfiguration.kind) {
      case "ignore-only":
        if (ignoreConfiguration.repoNames.indexOf(pr.repoName) !== -1) {
          return MutedResult.INVISIBLE;
        }
        break;
      case "ignore-all":
        return MutedResult.INVISIBLE;
    }
  }
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
          return updatedSince ? MutedResult.VISIBLE : MutedResult.MUTED;
        case "next-comment-by-author":
          const commentedSince =
            getLastAuthorCommentTimestamp(pr) > muted.until.mutedAtTimestamp;
          return commentedSince ? MutedResult.VISIBLE : MutedResult.MUTED;
        case "not-draft":
          return pr.draft ? MutedResult.MUTED : MutedResult.VISIBLE;
        case "specific-time":
          return currentTime >= muted.until.unmuteAtTimestamp
            ? MutedResult.VISIBLE
            : MutedResult.MUTED;
        case "forever":
          return MutedResult.MUTED;
      }
    }
  }
  return MutedResult.VISIBLE;
}

export enum MutedResult {
  VISIBLE,
  MUTED,
  INVISIBLE,
}
