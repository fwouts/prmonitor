import Octokit from "@octokit/rest";

/**
 * Loads the GitHub login of the current user.
 */
export async function loadAuthenticatedUser(octokit: Octokit): Promise<User> {
  const { data } = await octokit.users.getAuthenticated({});
  return data;
}

export interface User {
  login: string;
}
