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
): boolean {
  return (
    pr.authorLogin !== currentUserLogin &&
    (reviewRequested(pr, currentUserLogin) ||
      userPreviouslyReviewed(pr, currentUserLogin)) &&
    isNewReviewNeeded(pr, currentUserLogin)
  );
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
function isNewReviewNeeded(pr: PullRequest, currentUserLogin: string): boolean {
  const lastReviewOrCommentFromCurrentUser = getLastReviewOrCommentTimestamp(
    pr,
    currentUserLogin
  );
  const lastCommentFromAuthor = getLastAuthorCommentTimestamp(pr);
  return (
    lastReviewOrCommentFromCurrentUser === 0 ||
    lastReviewOrCommentFromCurrentUser < lastCommentFromAuthor
  );
}
