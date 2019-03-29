import Octokit from "@octokit/rest";

/**
 * Loads all reviews for a given pull request.
 */
export async function loadAllReviews(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullRequestNumber: number
): Promise<Review[]> {
  return octokit.paginate(
    octokit.pulls.listReviews.endpoint.merge({
      owner,
      repo,
      number: pullRequestNumber
    })
  );
}

export interface Review {
  state: "PENDING" | "COMMENTED" | "CHANGES_REQUESTED" | "APPROVED";
  submitted_at: string;
  user: {
    login: string;
  };
}
