import Octokit from "@octokit/rest";

/**
 * Loads all repositories that a user has access to.
 */
export async function loadAllRepos(octokit: Octokit): Promise<Array<Repo>> {
  let response = await octokit.repos.getAll({
    per_page: 100
  });
  let { data } = response;
  while (octokit.hasNextPage(response as any)) {
    response = await octokit.getNextPage(response as any);
    data = data.concat(response.data);
  }
  return data;
}

export interface Repo {
  owner: {
    login: string;
  };
  name: string;
  updated_at: string;
}
