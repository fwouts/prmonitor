import Octokit from "@octokit/rest";

/**
 * Loads all pull requests in a given repository.
 */
export async function loadAllPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all"
): Promise<Array<PullRequest>> {
  let response = await octokit.pullRequests.getAll({
    owner,
    repo,
    state,
    per_page: 100
  });
  let { data } = response;
  while (octokit.hasNextPage(response as any)) {
    response = await octokit.getNextPage(response as any);
    data = data.concat(response.data);
  }
  // Unfortunately, Octokit has the wrong types.
  return (data as any) as PullRequest[];
}

export interface PullRequest {
  base: {
    ref: string;
    repo: {
      owner: {
        login: string;
      };
      name: string;
    };
  };
  user: {
    login: string;
  };
  id: number;
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  requested_reviewers: Array<{
    login: string;
  }>;
}
