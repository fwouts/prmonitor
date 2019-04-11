import { ChromeApi } from "../chrome";
import { GitHubState } from "../state/github";
import { Store } from "../state/storage/store";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests(chromeApi: ChromeApi, store: Store) {
  let error;
  const github = new GitHubState(chromeApi, store);
  try {
    await github.load();
    if (!github.token) {
      return;
    }
    await github.refreshPullRequests();
    error = null;
  } catch (e) {
    error = e;
  }
  github.setError(error ? error.message : null);
}
