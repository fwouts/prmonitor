import { PullRequest, ReviewState } from "../storage/loaded-state";
import { userPreviouslyReviewed } from "./reviewed";
import {
  getLastAuthorCommentTimestamp,
  getLastCommitTimestamp,
  getLastReviewOrCommentTimestamp
} from "./timestamps";

/**
 * Returns the {@link PullRequestStatus} of a PR.
 */
export function pullRequestStatus(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestStatus {
  if (pr.author.login === currentUserLogin) {
    return outgoingPullRequestStatus(pr, currentUserLogin);
  }
  if (!pr.reviewRequested && !userPreviouslyReviewed(pr, currentUserLogin)) {
    return PullRequestStatus.NOT_INVOLVED;
  }
  return incomingPullRequestStatus(pr, currentUserLogin);
}

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

function outgoingPullRequestStatus(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestStatus {
  const lastReviewOrCommentFromCurrentUserTimestamp = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const lastCommitTimestamp = getLastCommitTimestamp(pr);
  const lastActionByCurrentUserTimestamp = Math.max(
    lastReviewOrCommentFromCurrentUserTimestamp,
    lastCommitTimestamp
  );
  const statusByUser = new Map<string, ReviewState>();
  for (const review of pr.reviews) {
    if (review.state === "COMMENTED") {
      // A comment doesn't necessarily override a previous request for changes
      // or an approval. Best to just ignore it?
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (
      submittedAt < lastActionByCurrentUserTimestamp &&
      review.state === "CHANGES_REQUESTED"
    ) {
      // This change request may not be relevant anymore.
      statusByUser.set(review.authorLogin, "PENDING");
      continue;
    }
    statusByUser.set(review.authorLogin, review.state);
  }

  // Requested reviewers are specifically reviewers who haven't posted a review
  // after a request. This can also be the case when they had previously
  // reviewed, but the author requested another review from them.
  for (const requestedReviewer of pr.requestedReviewers || []) {
    statusByUser.set(requestedReviewer, "PENDING");
  }

  const statuses = new Set(statusByUser.values());
  if (statuses.has("CHANGES_REQUESTED")) {
    return PullRequestStatus.OUTGOING_PENDING_CHANGES;
  }
  if (statuses.has("PENDING")) {
    return PullRequestStatus.OUTGOING_PENDING_REVIEW_HAS_REVIEWERS;
  }
  if (statuses.has("APPROVED")) {
    return PullRequestStatus.OUTGOING_APPROVED_BY_EVERYONE;
  }
  // If there are no reviewers (e.g. for a PR on an open source repo you're not
  // a member of) then default to pending review.
  return statuses.size > 0
    ? PullRequestStatus.OUTGOING_PENDING_REVIEW_HAS_REVIEWERS
    : PullRequestStatus.OUTGOING_PENDING_REVIEW_NO_REVIEWERS;
}

export enum PullRequestStatus {
  /**
   * A review has been requested from the user, but they haven't submitted any
   * review or comments on the PR yet.
   */
  INCOMING_NEW_REVIEW_REQUESTED,

  /**
   * A review or comment was previously submitted by the user, and the author
   * has since posted a comment.
   */
  INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR,

  /**
   * A review or comment was previously submitted by the user, and a new commit
   * has since been added to the PR.
   */
  INCOMING_REVIEWED_NEW_COMMIT,

  /**
   * A review or comment was previously submitted by the user, and the author
   * has since posted a comment. Additionally, a new commit has also been added
   * to the PR.
   */
  INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR,

  /**
   * A review or comment was submitted by the user, and the PR has not been
   * updated since (no comment or further changes by the author).
   */
  INCOMING_REVIEWED_PENDING_REPLY,

  /**
   * The current user is not involved in the PR. That is, they are not a
   * reviewer and haven't posted any comments.
   */
  NOT_INVOLVED,

  /**
   * The current user has sent a PR and is waiting for a review from specific people.
   */
  OUTGOING_PENDING_REVIEW_HAS_REVIEWERS,

  /**
   * The current user has created a PR but has no specific reviewers assigned
   * (e.g. common for open source contributions).
   */
  OUTGOING_PENDING_REVIEW_NO_REVIEWERS,

  /**
   * The current user has sent a PR and received review comments which need to
   * be addressed either by responding or adding new commits.
   */
  OUTGOING_PENDING_CHANGES,

  /**
   * The current user has sent a PR and received approval from all reviewers.
   */
  OUTGOING_APPROVED_BY_EVERYONE
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
