import { PullRequest, Review } from "../storage/last-check";

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
      (userDidReview(pr, currentUserLogin) &&
        isNewReviewNeeded(pr.authorLogin, currentUserLogin, pr.reviews)))
  );
}

/**
 * Returns whether a review is specifically requested from the user.
 */
function reviewRequested(pr: PullRequest, currentUserLogin: string): boolean {
  return pr.requestedReviewers.includes(currentUserLogin);
}

/**
 * Returns whether the user previously reviewed a PR (even if not explicitly requested).
 */
function userDidReview(pr: PullRequest, currentUserLogin: string): boolean {
  return pr.reviews.findIndex(r => r.authorLogin === currentUserLogin) !== -1;
}

/**
 * Returns whether the user, who previously wrote a review, needs to take another look.
 */
function isNewReviewNeeded(
  pullRequestAuthorLogin: string,
  currentUserLogin: string,
  reviews: Review[]
): boolean {
  let lastReviewFromCurrentUser = 0;
  let lastChangeFromAuthor = 0;
  for (const review of reviews) {
    if (review.state === "PENDING") {
      // Ignore pending reviews (we don't want a user to think that they've submitted their
      // review when they didn't yet).
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (review.authorLogin === pullRequestAuthorLogin) {
      lastChangeFromAuthor = submittedAt;
    } else if (review.authorLogin === currentUserLogin) {
      lastReviewFromCurrentUser = submittedAt;
    } else {
      // Comment from someone else. Ignore.
    }
  }
  return lastReviewFromCurrentUser < lastChangeFromAuthor;
}
