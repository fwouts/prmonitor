import Octokit, { ReposGetResponse } from "@octokit/rest";
import { LoadedState, Repo } from "../storage/loaded-state";
import { GitHubLoader } from "./api";
import { loadRepos } from "./internal/github-api/repos";
import { loadAuthenticatedUser } from "./internal/github-api/user";
import { refreshOpenPullRequests } from "./internal/pull-requests";

export function buildGitHubLoader(): GitHubLoader {
  return load;
}

async function load(
  token: string,
  lastCheck: LoadedState | null
): Promise<LoadedState> {
  const octokit = new Octokit({
    auth: `token ${token}`
  });
  const user = await loadAuthenticatedUser(octokit);
  const repos = await loadRepos(octokit).then(r => r.map(repoFromResponse));
  const openPullRequests = await refreshOpenPullRequests(
    octokit,
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
