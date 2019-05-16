import { PullRequest } from "../storage/loaded-state";
import { userPreviouslyReviewed } from "./reviewed";
import {
  getLastAuthorCommentTimestamp,
  getLastCommitTimestamp,
  getLastReviewOrCommentTimestamp
} from "./timestamps";

/**
 * Returns whether another review is needed for a PR:
 * - either a review is explicitly requested
 * - or the PR has been updated by the author (new commit or comment) since the last review
 */
export function pullRequestStatus(
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
  return incomingPullRequestStatus(pr, currentUserLogin);
}

/**
 * Returns whether a review is specifically requested from the user.
 */
function reviewRequested(pr: PullRequest, currentUserLogin: string): boolean {
  return (
    (pr.requestedReviewers &&
      pr.requestedReviewers.includes(currentUserLogin)) ||
    pr.reviewRequested ||
    false
  );
}

/**
 * Returns whether the user, who previously wrote a review, needs to take another look.
 */
function incomingPullRequestStatus(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestStatus {
  const lastReviewOrCommentFromCurrentUser = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const hasNewCommentByAuthor =
    lastReviewOrCommentFromCurrentUser < getLastAuthorCommentTimestamp(pr);
  const hasNewCommit =
    lastReviewOrCommentFromCurrentUser < getLastCommitTimestamp(pr);
  if (lastReviewOrCommentFromCurrentUser === 0) {
    return PullRequestStatus.INCOMING_NEW_REVIEW_REQUESTED;
  } else if (hasNewCommentByAuthor && hasNewCommit) {
    return PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR;
  } else if (hasNewCommit) {
    return PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT;
  } else if (hasNewCommentByAuthor) {
    return PullRequestStatus.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR;
  } else {
    return PullRequestStatus.INCOMING_REVIEWED_PENDING_REPLY;
  }
}

export enum PullRequestStatus {
  INCOMING_NEW_REVIEW_REQUESTED,
  INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR,
  INCOMING_REVIEWED_NEW_COMMIT,
  INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR,
  INCOMING_REVIEWED_PENDING_REPLY,
  NOT_INVOLVED,
  OUTGOING
}

export function isReviewRequired(status: PullRequestStatus) {
  switch (status) {
    case PullRequestStatus.INCOMING_NEW_REVIEW_REQUESTED:
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR:
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT:
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR:
      return true;
    default:
      return false;
  }
}
