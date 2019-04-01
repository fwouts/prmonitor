import Octokit from "@octokit/rest";

/**
 * Loads the GitHub login of the current user.
 */
export async function loadAuthenticatedUser(
  octokit: Octokit
): Promise<GetAuthenticatedUserResponse> {
  const { data } = await octokit.users.getAuthenticated({});
  return data;
}

// Type missing from @octokit/rest.
export interface GetAuthenticatedUserResponse {
  login: string;
}
