import { buildGitHubApi } from "../github-api/implementation";
import { LoadedState } from "../storage/loaded-state";
import { GitHubLoader } from "./api";
import { refreshOpenPullRequests } from "./internal/pull-requests";

export function buildGitHubLoader(): GitHubLoader {
  return load;
}

async function load(token: string): Promise<LoadedState> {
  const githubApi = buildGitHubApi(token);
  const user = await githubApi.loadAuthenticatedUser();
  const openPullRequests = await refreshOpenPullRequests(githubApi, user.login);
  return {
    userLogin: user.login,
    openPullRequests
  };
}
