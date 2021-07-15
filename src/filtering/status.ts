import { PullRequest, ReviewState } from "../storage/loaded-state";
import { userPreviouslyReviewed } from "./reviewed";
import {
  getLastAuthorCommentTimestamp,
  getLastCommitTimestamp,
  getLastReviewOrCommentTimestamp,
} from "./timestamps";

/**
 * Returns the {@link PullRequestState} of a PR.
 */
export function pullRequestState(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestState {
  if (pr.author?.login === currentUserLogin) {
    return outgoingPullRequestState(pr, currentUserLogin);
  }
  if (!pr.reviewRequested && !userPreviouslyReviewed(pr, currentUserLogin)) {
    return {
      kind: "not-involved",
      draft: pr.draft === true,
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
    draft: pr.draft === true,
    newReviewRequested: !hasReviewed,
    authorResponded: hasReviewed && hasNewCommentByAuthor,
    newCommit: hasReviewed && hasNewCommit,
    directlyAdded: (pr.requestedReviewers || []).includes(currentUserLogin),
    teams: pr.requestedTeams || [],
  };
}

function outgoingPullRequestState(
  pr: PullRequest,
  currentUserLogin: string
): PullRequestState {
  const lastReviewOrCommentFromCurrentUserTimestamp =
    getLastReviewOrCommentTimestamp(pr, currentUserLogin);
  const lastCommitTimestamp = getLastCommitTimestamp(pr);
  const lastActionByCurrentUserTimestamp = Math.max(
    lastReviewOrCommentFromCurrentUserTimestamp,
    lastCommitTimestamp
  );
  const stateByUser = new Map<string, ReviewState>();

  // Keep track of the last known state of reviews left by others.
  for (const review of pr.reviews) {
    if (review.authorLogin === currentUserLogin || !review.submittedAt) {
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (
      submittedAt < lastActionByCurrentUserTimestamp &&
      review.state === "CHANGES_REQUESTED"
    ) {
      // This change request may not be relevant anymore because the author has
      // taken action.
      stateByUser.set(review.authorLogin, "PENDING");
      continue;
    }
    // Set the user's current state to the current review. If it's a comment
    // however, we don't want to override a previous approval or request for
    // changes.
    if (!stateByUser.has(review.authorLogin) || review.state !== "COMMENTED") {
      stateByUser.set(review.authorLogin, review.state);
    }
  }

  // Ensure that anyone who commented without leaving a review is counted too.
  for (const comment of pr.comments) {
    if (comment.authorLogin === currentUserLogin) {
      continue;
    }
    if (!stateByUser.has(comment.authorLogin)) {
      stateByUser.set(comment.authorLogin, "COMMENTED");
    }
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
    mergeable: pr.mergeable === true,
    approvedByEveryone: states.has("APPROVED") && states.size === 1,
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
   * True if the PR is a draft.
   */
  draft: boolean;

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

  /**
   * True if a review has been requested for the current user, and not just included indirectly via a team.
   */
  directlyAdded: boolean;

  /**
   * List of team names requested.
   */
  teams: string[];
}

/**
 * The current user is not involved in the PR. That is, they are not a
 * reviewer and haven't posted any comments.
 */
export interface NotInvolvedState {
  kind: "not-involved";

  /**
   * True if the PR is a draft.
   */
  draft: boolean;
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
   * True if GitHub indicates that the PR can be merged.
   */
  mergeable: boolean;

  /**
   * True if the PR was approved by all reviewers.
   */
  approvedByEveryone: boolean;
}

export function isReviewRequired(
  state: PullRequestState,
  notifyNewCommits: boolean,
  onlyDirectRequests: boolean,
  whitelistedTeams: string[]
) {
  const inWhitelistedTeams =
    state.kind === "incoming" &&
    state.teams.some((team) => whitelistedTeams.includes(team));
  const v =
    state.kind === "incoming" &&
    (!onlyDirectRequests || state.directlyAdded || inWhitelistedTeams) &&
    (state.newReviewRequested ||
      state.authorResponded ||
      (notifyNewCommits && state.newCommit));

  return v;
}
