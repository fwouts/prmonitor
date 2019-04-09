import { PullRequest, Review } from "../storage/last-check";
import { MuteConfiguration } from "../storage/mute";

/**
 * Returns whether another review is needed for a PR:
 * - either a review is explicitly requested
 * - or the PR has been updated by the author (new commit or comment) since the last review
 */
export function isReviewNeeded(
  pr: PullRequest,
  currentUserLogin: string,
  muteConfiguration: MuteConfiguration
): boolean {
  return (
    pr.authorLogin !== currentUserLogin &&
    !isMuted(pr, muteConfiguration) &&
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
  let lastReviewFromCurrentUser = getLastChangeFrom(currentUserLogin, reviews);
  let lastChangeFromAuthor = getLastChangeFrom(pullRequestAuthorLogin, reviews);
  return lastReviewFromCurrentUser < lastChangeFromAuthor;
}

/**
 * Returns whether the pull request is muted.
 */
function isMuted(pr: PullRequest, muteConfiguration: MuteConfiguration) {
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
            getLastChangeFrom(pr.authorLogin, pr.reviews) >
            muted.until.mutedAtTimestamp;
          return !updatedSince;
      }
    }
  }
  return false;
}

function getLastChangeFrom(login: string, reviews: Review[]) {
  let lastChange = 0;
  for (const review of reviews) {
    if (review.state === "PENDING") {
      // Ignore pending reviews (we don't want a user to think that they've submitted their
      // review when they didn't yet).
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (review.authorLogin === login) {
      lastChange = submittedAt;
    }
  }
  return lastChange;
}
