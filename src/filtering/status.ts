import { PullRequest, ReviewState } from "../storage/loaded-state";
import { userPreviouslyReviewed } from "./reviewed";
import {
  getLastAuthorCommentTimestamp,
  getLastCommitTimestamp,
  getLastReviewOrCommentTimestamp
} from "./timestamps";

/**
 * Returns the {@link PullRequestState} of a PR.
 */
export function pullRequestState(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestState {
  if (pr.author.login === currentUserLogin) {
    return outgoingPullRequestState(pr, currentUserLogin);
  }
  if (!pr.reviewRequested && !userPreviouslyReviewed(pr, currentUserLogin)) {
    return {
      kind: "not-involved"
    };
  }
  return incomingPullRequestState(pr, currentUserLogin);
}

function incomingPullRequestState(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestState {
  const lastReviewOrCommentFromCurrentUser = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const hasNewCommentByAuthor =
    lastReviewOrCommentFromCurrentUser < getLastAuthorCommentTimestamp(pr);
  const hasNewCommit =
    lastReviewOrCommentFromCurrentUser < getLastCommitTimestamp(pr);
  const hasReviewed = lastReviewOrCommentFromCurrentUser > 0;
  return {
    kind: "incoming",
    newReviewRequested: !hasReviewed,
    authorResponded: hasReviewed && hasNewCommentByAuthor,
    newCommit: hasReviewed && hasNewCommit
  };
}

function outgoingPullRequestState(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestState {
  const lastReviewOrCommentFromCurrentUserTimestamp = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const lastCommitTimestamp = getLastCommitTimestamp(pr);
  const lastActionByCurrentUserTimestamp = Math.max(
    lastReviewOrCommentFromCurrentUserTimestamp,
    lastCommitTimestamp
  );
  const stateByUser = new Map<string, ReviewState>();
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
      stateByUser.set(review.authorLogin, "PENDING");
      continue;
    }
    stateByUser.set(review.authorLogin, review.state);
  }

  // Requested reviewers are specifically reviewers who haven't posted a review
  // after a request. This can also be the case when they had previously
  // reviewed, but the author requested another review from them.
  for (const requestedReviewer of pr.requestedReviewers || []) {
    stateByUser.set(requestedReviewer, "PENDING");
  }

  const states = new Set(stateByUser.values());
  return {
    kind: "outgoing",
    draft: pr.draft === true,
    noReviewers: stateByUser.size === 0,
    changesRequested: states.has("CHANGES_REQUESTED"),
    approvedByEveryone: states.has("APPROVED") && states.size === 1
  };
}

export type PullRequestState = IncomingState | NotInvolvedState | OutgoingState;

/**
 * The current user is involved in the PR, either because they are a reviewer or
 * because they've added comments.
 */
export interface IncomingState {
  kind: "incoming";

  /**
   * True if a review has been requested from the user, but they haven't
   * submitted any review or comments on the PR yet.
   */
  newReviewRequested: boolean;

  /**
   * True if the author posted a comment after a review or comment was
   * previously submitted by the user.
   */
  authorResponded: boolean;

  /**
   * True if a new commit was added to the PR after a review or comment was
   * previously submitted by the user.
   */
  newCommit: boolean;
}

/**
 * The current user is not involved in the PR. That is, they are not a
 * reviewer and haven't posted any comments.
 */
export interface NotInvolvedState {
  kind: "not-involved";
}

/**
 * The PR that authored by the current user.
 */
export interface OutgoingState {
  kind: "outgoing";

  /**
   * True if the PR is a draft.
   */
  draft: boolean;

  /**
   * True if the PR has no reviewers yet.
   */
  noReviewers: boolean;

  /**
   * True if the PR received review comments which need to be addressed either
   * by responding or adding new commits.
   */
  changesRequested: boolean;

  /**
   * True if the PR was approved by all reviewers.
   */
  approvedByEveryone: boolean;
}

export function isReviewRequired(state: PullRequestState) {
  return (
    state.kind === "incoming" &&
    (state.newReviewRequested || state.authorResponded || state.newCommit)
  );
}
