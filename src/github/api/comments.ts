import Octokit, { PullsListCommentsResponse } from "@octokit/rest";

/**
 * Loads all comments for a given pull request.
 */
export async function loadComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullRequestNumber: number
): Promise<PullsListCommentsResponse> {
  return octokit.paginate(
    octokit.pulls.listComments.endpoint.merge({
      owner,
      repo,
      number: pullRequestNumber
    })
  );
}
