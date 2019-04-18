import { GitHubApi, PullRequestReference } from "../../github-api/api";
import { Comment } from "../../storage/loaded-state";

/**
 * Loads all comments for a pull request.
 */
export async function loadAllComments(
  githubApi: GitHubApi,
  pr: PullRequestReference
): Promise<Comment[]> {
  const comments = await githubApi.loadComments(pr);
  return comments.map(comment => ({
    authorLogin: comment.user.login,
    createdAt: comment.created_at
  }));
}
