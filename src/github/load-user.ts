import Octokit from "@octokit/rest";

/**
 * Loads the GitHub login of the current user.
 */
export async function getCurrentUserLogin(octokit: Octokit): Promise<string> {
  const { data } = await octokit.users.getAuthenticated({});
  return data.login;
}
