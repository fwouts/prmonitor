import Octokit, {
  PullsListReviewsResponseItem as IncompletePullsListReviewsResponseItem
} from "@octokit/rest";

/**
 * Loads all reviews for a given pull request.
 */
export async function loadReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullRequestNumber: number
): Promise<PullsListReviewsResponse> {
  return octokit.paginate(
    octokit.pulls.listReviews.endpoint.merge({
      owner,
      repo,
      number: pullRequestNumber
    })
  );
}

export type PullsListReviewsResponse = PullsListReviewsResponseItem[];

// PullsListReviewsResponseItem provides in @octokit/rest isn't specific enough
// about state and lacks fields such as submitted_at.
export interface PullsListReviewsResponseItem
  extends IncompletePullsListReviewsResponseItem {
  state: "PENDING" | "COMMENTED" | "CHANGES_REQUESTED" | "APPROVED";
  submitted_at: string;
}
