import { PullRequest } from "../storage/loaded-state";

export function getLastUpdateTimestamp(pr: PullRequest) {
  let prTimestamp = Math.max(
    new Date(pr.updatedAt).getTime(),
    getLastCommitTimestamp(pr)
  );
  for (const comment of pr.comments) {
    prTimestamp = Math.max(prTimestamp, new Date(comment.createdAt).getTime());
  }
  for (const review of pr.reviews) {
    prTimestamp = Math.max(prTimestamp, new Date(review.submittedAt).getTime());
  }
  return prTimestamp;
}

export function getLastAuthorUpdateTimestamp(pr: PullRequest): number {
  return Math.max(
    getLastAuthorCommentTimestamp(pr),
    getLastCommitTimestamp(pr)
  );
}

export function getLastAuthorCommentTimestamp(pr: PullRequest): number {
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

export function getLastCommitTimestamp(pr: PullRequest): number {
  let lastCommitTime = 0;
  for (const commit of pr.commits || []) {
    const createdAt = new Date(commit.createdAt).getTime();
    lastCommitTime = Math.max(lastCommitTime, createdAt);
  }
  return lastCommitTime;
}
