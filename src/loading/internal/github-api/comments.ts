import Octokit, { IssuesListCommentsResponse } from "@octokit/rest";

/**
 * Loads all comments for a given pull request.
 */
export async function loadComments(
  octokit: Octokit,
  owner: string,
  repo: string,
  pullRequestNumber: number
): Promise<IssuesListCommentsResponse> {
  return octokit.paginate(
    octokit.issues.listComments.endpoint.merge({
      owner,
      repo,
      issue_number: pullRequestNumber
    })
  );
}
