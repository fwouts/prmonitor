import { ChromeApi } from "../chrome";
import { Core } from "../state/core";
import { GitHubLoader } from "../state/github-loader";
import { getStore } from "../state/storage/store";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests(
  chromeApi: ChromeApi,
  githubLoader: GitHubLoader
) {
  let error;
  const core = new Core(chromeApi, getStore(chromeApi), githubLoader);
  try {
    await core.load();
    if (!core.token) {
      return;
    }
    await core.refreshPullRequests();
    error = null;
  } catch (e) {
    error = e;
  }
  core.setError(error ? error.message : null);
}
