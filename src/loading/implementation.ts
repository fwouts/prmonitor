import { buildGitHubApi } from "../github-api/implementation";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import { GitHubLoader } from "./api";
import { refreshOpenPullRequests } from "./internal/pull-requests";

export function buildGitHubLoader(): GitHubLoader {
  return load;
}

async function load(token: string): Promise<LoadedState> {
  const githubApi = buildGitHubApi(token);
  const user = await githubApi.loadAuthenticatedUser();
  const openPullRequests = await refreshOpenPullRequests(githubApi, user.login);
  const sorted = [...openPullRequests].sort((a, b) => {
    return getPullRequestTimestamp(b) - getPullRequestTimestamp(a);
  });
  return {
    userLogin: user.login,
    openPullRequests: sorted
  };
}

function getPullRequestTimestamp(pr: PullRequest) {
  let prTimestamp = new Date(pr.updatedAt).getTime();
  for (const comment of pr.comments) {
    prTimestamp = Math.max(prTimestamp, new Date(comment.createdAt).getTime());
  }
  for (const review of pr.reviews) {
    prTimestamp = Math.max(prTimestamp, new Date(review.submittedAt).getTime());
  }
  return prTimestamp;
}
