import Octokit, { PullsGetResponse, PullsListResponse } from "@octokit/rest";

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

/**
 * Loads a specific pull request.
 */
export async function loadPullRequest(
  octokit: Octokit,
  owner: string,
  repo: string,
  number: number
): Promise<PullsGetResponse> {
  const response = await octokit.pulls.get({
    owner,
    repo,
    number
  });
  return response.data;
}
