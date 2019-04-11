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
  const core = new Core(chromeApi, getStore(chromeApi), githubLoader);
  await core.load();
  if (!core.token) {
    return;
  }
  await core.refreshPullRequests();
}
