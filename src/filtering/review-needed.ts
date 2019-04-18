import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";

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
      userDidReview(pr, currentUserLogin)) &&
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
            getLastAuthorCommentTimestamp(pr) > muted.until.mutedAtTimestamp;
          return !updatedSince;
      }
    }
  }
  return false;
}

function getLastAuthorCommentTimestamp(pr: PullRequest): number {
  return getLastReviewOrCommentTimestamp(pr, pr.authorLogin);
}

function getLastReviewOrCommentTimestamp(
  pr: PullRequest,
  login: string
): number {
  let lastCommentedTime = 0;
  for (const review of pr.reviews) {
    if (review.state === "PENDING") {
      // Ignore pending reviews (we don't want a user to think that they've submitted their
      // review when they didn't yet).
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (review.authorLogin === login) {
      lastCommentedTime = Math.max(lastCommentedTime, submittedAt);
    }
  }
  for (const comment of pr.comments || []) {
    const createdAt = new Date(comment.createdAt).getTime();
    if (comment.authorLogin === login) {
      lastCommentedTime = Math.max(lastCommentedTime, createdAt);
    }
  }
  return lastCommentedTime;
}
