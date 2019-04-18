import { ReposGetResponse } from "@octokit/rest";
import { buildGitHubApi } from "../github-api/implementation";
import { LoadedState, Repo } from "../storage/loaded-state";
import { GitHubLoader } from "./api";
import { refreshOpenPullRequests } from "./internal/pull-requests";

export function buildGitHubLoader(): GitHubLoader {
  return load;
}

async function load(
  token: string,
  lastCheck: LoadedState | null
): Promise<LoadedState> {
  const githubApi = buildGitHubApi(token);
  const user = await githubApi.loadAuthenticatedUser();
  const repos = await githubApi.loadRepos().then(r => r.map(repoFromResponse));
  const openPullRequests = await refreshOpenPullRequests(
    githubApi,
    repos,
    lastCheck
  );
  return {
    userLogin: user.login,
    openPullRequests,
    repos
  };
}

function repoFromResponse(response: ReposGetResponse): Repo {
  return {
    owner: response.owner.login,
    name: response.name,
    pushedAt: response.pushed_at
  };
}
