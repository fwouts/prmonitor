import { showBadgeError } from "../badge";
import { GitHubState } from "../state/github";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests() {
  let error;
  const github = new GitHubState();
  try {
    await github.load();
    if (!github.token) {
      return;
    }
    await github.refreshPullRequests();
    error = null;
  } catch (e) {
    error = e;
    await showBadgeError();
  }
  github.setError(error ? error.message : null);
}
