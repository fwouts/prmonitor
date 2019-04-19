import { PullRequest } from "../storage/loaded-state";

export function getLastAuthorCommentTimestamp(pr: PullRequest): number {
  return getLastReviewOrCommentTimestamp(pr, pr.authorLogin);
}

export function getLastReviewOrCommentTimestamp(
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
