import Octokit, {
  PullsGetResponse,
  PullsListResponseItem
} from "@octokit/rest";
import { loadReviews, PullsListReviewsResponse } from "./github-api/reviews";

/**
 * Loads all reviews for a set of pull requests.
 *
 * @returns a dictionary where keys are pull request node IDs.
 */
export async function loadAllReviews(
  octokit: Octokit,
  pullRequests: Array<PullsListResponseItem | PullsGetResponse>
): Promise<{
  [pullRequestNodeId: string]: PullsListReviewsResponse;
}> {
  const reviews = await Promise.all(
    pullRequests.map(
      async (pr): Promise<[string /* node ID */, PullsListReviewsResponse]> => [
        pr.node_id,
        await loadReviews(
          octokit,
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        )
      ]
    )
  );
  const reviewsPerPullRequest = reviews.reduce<{
    [pullRequestNodeId: string]: PullsListReviewsResponse;
  }>((acc, [nodeId, reviews]) => {
    acc[nodeId] = reviews;
    return acc;
  }, {});
  return reviewsPerPullRequest;
}
