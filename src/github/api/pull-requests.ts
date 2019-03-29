import Octokit from "@octokit/rest";

/**
 * Loads all pull requests in a given repository.
 */
export async function loadPullRequests(
  octokit: Octokit,
  owner: string,
  repo: string,
  state: "open" | "closed" | "all"
): Promise<Array<PullRequest>> {
  return octokit.paginate(
    octokit.pulls.list.endpoint.merge({
      owner,
      repo,
      state
    })
  );
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
