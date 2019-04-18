import Octokit, { ReposGetResponse } from "@octokit/rest";

/**
 * Loads all repositories that a user has access to.
 */
export async function loadRepos(octokit: Octokit): Promise<ReposListResponse> {
  return octokit.paginate(
    octokit.repos.list.endpoint.merge({
      sort: "pushed",
      direction: "desc"
    })
  );
}

// Type missing from @octokit/rest.
export type ReposListResponse = ReposGetResponse[];
