import { GitHubApi, PullRequestReference } from "../../github-api/api";
import { Review } from "../../storage/loaded-state";

/**
 * Loads all reviews for a pull request.
 */
export async function loadAllReviews(
  githubApi: GitHubApi,
  pr: PullRequestReference
): Promise<Review[]> {
  const reviews = await githubApi.loadReviews(pr);
  return reviews.map(review => ({
    authorLogin: review.user.login,
    state: review.state,
    submittedAt: review.submitted_at
  }));
}
