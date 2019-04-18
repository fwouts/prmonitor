import Octokit from "@octokit/rest";
import { Review } from "../../storage/loaded-state";
import {
  loadReviews,
  PullsListReviewsResponseItem
} from "./github-api/reviews";

/**
 * Loads all reviews for a pull request.
 */
export async function loadAllReviews(
  octokit: Octokit,
  pullRequest: {
    repoOwner: string;
    repoName: string;
    pullRequestNumber: number;
  }
): Promise<Review[]> {
  const reviews = await loadReviews(
    octokit,
    pullRequest.repoOwner,
    pullRequest.repoName,
    pullRequest.pullRequestNumber
  );
  return reviews.map(reviewFromResponse);
}

function reviewFromResponse(review: PullsListReviewsResponseItem): Review {
  return {
    authorLogin: review.user.login,
    state: review.state,
    submittedAt: review.submitted_at
  };
}
