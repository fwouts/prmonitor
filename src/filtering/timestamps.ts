import { PullRequest } from "../storage/loaded-state";

export function getLastUpdateTimestamp(pr: PullRequest) {
  let prTimestamp = new Date(pr.updatedAt).getTime();
  for (const comment of pr.comments) {
    prTimestamp = Math.max(prTimestamp, new Date(comment.createdAt).getTime());
  }
  for (const review of pr.reviews) {
    if (!review.submittedAt) {
      continue;
    }
    prTimestamp = Math.max(prTimestamp, new Date(review.submittedAt).getTime());
  }
  return prTimestamp;
}

export function getLastAuthorCommentTimestamp(pr: PullRequest): number {
  if (!pr.author) {
    return 0;
  }
  return getLastReviewOrCommentTimestamp(pr, pr.author.login);
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
    if (!review.submittedAt) {
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

export function getLastReviewTimestamp(
  pr: PullRequest,
  login: string
): number {
  let lastReviewedTime = 0;
  for (const review of pr.reviews) {
    if (review.state === "PENDING") {
      continue;
    }
    if (!review.submittedAt) {
      continue;
    }
    const submittedAt = new Date(review.submittedAt).getTime();
    if (review.authorLogin === login) {
      lastReviewedTime = Math.max(lastReviewedTime, submittedAt);
    }
  }
  return lastReviewedTime;
}
