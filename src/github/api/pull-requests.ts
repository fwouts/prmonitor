import Octokit, { PullsListResponse } from "@octokit/rest";

/**
 * Loads all pull requests in a given repository.
 */
export async function loadPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all"
): Promise<PullsListResponse> {
  return octokit.paginate(
    octokit.pulls.list.endpoint.merge({
      owner,
      repo,
      state
    })
  );
}
