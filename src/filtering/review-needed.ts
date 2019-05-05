import { PullRequest } from "../storage/loaded-state";
import { userPreviouslyReviewed } from "./reviewed";
import {
  getLastAuthorCommentTimestamp,
  getLastReviewOrCommentTimestamp
} from "./timestamps";

/**
 * Returns whether another review is needed for a PR:
 * - either a review is explicitly requested
 * - or the PR has been updated by the author (new commit or comment) since the last review
 */
export function isReviewNeeded(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestStatus {
  if (pr.author.login === currentUserLogin) {
    return PullRequestStatus.OUTGOING;
  }
  if (
    !reviewRequested(pr, currentUserLogin) &&
    !userPreviouslyReviewed(pr, currentUserLogin)
  ) {
    return PullRequestStatus.NOT_INVOLVED;
  }
  return isNewReviewNeeded(pr, currentUserLogin);
}

/**
 * Returns whether a review is specifically requested from the user.
 */
function reviewRequested(pr: PullRequest, currentUserLogin: string): boolean {
  return pr.requestedReviewers.includes(currentUserLogin);
}

/**
 * Returns whether the user, who previously wrote a review, needs to take another look.
 */
function isNewReviewNeeded(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestStatus {
  const lastReviewOrCommentFromCurrentUser = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const lastCommentFromAuthor = getLastAuthorCommentTimestamp(pr);
  if (lastReviewOrCommentFromCurrentUser === 0) {
    return PullRequestStatus.INCOMING_NEW_REVIEW_REQUESTED;
  } else if (lastReviewOrCommentFromCurrentUser < lastCommentFromAuthor) {
    return PullRequestStatus.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR;
  } else {
    return PullRequestStatus.INCOMING_REVIEWED_PENDING_REPLY;
  }
}

export enum PullRequestStatus {
  INCOMING_NEW_REVIEW_REQUESTED,
  INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR,
  INCOMING_REVIEWED_CODE_UPDATED,
  INCOMING_REVIEWED_PENDING_REPLY,
  NOT_INVOLVED,
  OUTGOING
}
