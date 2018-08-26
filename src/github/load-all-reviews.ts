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
  let response = await octokit.pullRequests.getReviews({
    owner,
    repo,
    number: pullRequestNumber,
    per_page: 100
  });
  let { data } = response;
  while (octokit.hasNextPage(response as any)) {
    response = await octokit.getNextPage(response as any);
    data = data.concat(response.data);
  }
  // Unfortunately, Octokit has the wrong types (e.g. missing submitted_at).
  return (data as any) as Review[];
}

export interface Review {
  state: "PENDING" | "COMMENTED" | "CHANGES_REQUESTED" | "APPROVED";
  submitted_at: string;
  user: {
    login: string;
  };
}
