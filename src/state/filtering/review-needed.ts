import { PullRequest } from "../storage/last-check";
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
        isNewReviewNeeded(pr, currentUserLogin)))
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
  return (
    (pr.comments || []).findIndex(r => r.authorLogin === currentUserLogin) !==
      -1 || pr.reviews.findIndex(r => r.authorLogin === currentUserLogin) !== -1
  );
}

/**
 * Returns whether the user, who previously wrote a review, needs to take another look.
 */
function isNewReviewNeeded(pr: PullRequest, currentUserLogin: string): boolean {
  let lastReviewFromCurrentUser = getLastReviewTimestamp(pr, currentUserLogin);
  let lastChangeFromAuthor = getLastAuthorUpdateTimestamp(pr);
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
            getLastAuthorUpdateTimestamp(pr) > muted.until.mutedAtTimestamp;
          return !updatedSince;
      }
    }
  }
  return false;
}

function getLastAuthorUpdateTimestamp(pr: PullRequest): number {
  return Math.max(
    getLastReviewTimestamp(pr, pr.authorLogin),
    pr.updatedAt ? new Date(pr.updatedAt).getTime() : 0
  );
}

function getLastReviewTimestamp(pr: PullRequest, login: string): number {
  let lastChange = 0;
  for (const review of pr.reviews) {
    if (review.state === "PENDING") {
      // Ignore pending reviews (we don't want a user to think that they've submitted their
      // review when they didn't yet).
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (review.authorLogin === login) {
      lastChange = Math.max(lastChange, submittedAt);
    }
  }
  for (const comment of pr.comments || []) {
    const createdAt = new Date(comment.createdAt).getTime();
    if (comment.authorLogin === login) {
      lastChange = Math.max(lastChange, createdAt);
    }
  }
  return lastChange;
}
