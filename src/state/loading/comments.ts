import Octokit, {
  PullsGetResponse,
  PullsListCommentsResponse,
  PullsListResponseItem
} from "@octokit/rest";
import { loadComments } from "../../github/api/comments";

/**
 * Loads all comments for a set of pull requests.
 *
 * @returns a dictionary where keys are pull request node IDs.
 */
export async function loadAllComments(
  octokit: Octokit,
  pullRequests: Array<PullsListResponseItem | PullsGetResponse>
): Promise<{
  [pullRequestNodeId: string]: PullsListCommentsResponse;
}> {
  const comments = await Promise.all(
    pullRequests.map(
      async (
        pr
      ): Promise<[string /* node ID */, PullsListCommentsResponse]> => [
        pr.node_id,
        await loadComments(
          octokit,
          pr.base.repo.owner.login,
          pr.base.repo.name,
          pr.number
        )
      ]
    )
  );
  const commentsPerPullRequest = comments.reduce<{
    [pullRequestNodeId: string]: PullsListCommentsResponse;
  }>((acc, [nodeId, comments]) => {
    acc[nodeId] = comments;
    return acc;
  }, {});
  return commentsPerPullRequest;
}
