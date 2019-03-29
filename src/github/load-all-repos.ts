import Octokit from "@octokit/rest";

/**
 * Loads all repositories that a user has access to.
 */
export async function loadAllRepos(octokit: Octokit): Promise<Array<Repo>> {
  return octokit.paginate(octokit.repos.list.endpoint.merge({}));
}

export interface Repo {
  owner: {
    login: string;
  };
  name: string;
  updated_at: string;
}
