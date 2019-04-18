import Octokit, { IssuesListCommentsResponseItem } from "@octokit/rest";
import { Comment } from "../../storage/loaded-state";
import { loadComments } from "./github-api/comments";

/**
 * Loads all comments for a pull request.
 */
export async function loadAllComments(
  octokit: Octokit,
  pullRequest: {
    repoOwner: string;
    repoName: string;
    pullRequestNumber: number;
  }
): Promise<Comment[]> {
  const comments = await loadComments(
    octokit,
    pullRequest.repoOwner,
    pullRequest.repoName,
    pullRequest.pullRequestNumber
  );
  return comments.map(commentFromResponse);
}

function commentFromResponse(comment: IssuesListCommentsResponseItem): Comment {
  return {
    authorLogin: comment.user.login,
    createdAt: comment.created_at
  };
}
