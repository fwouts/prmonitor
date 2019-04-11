import { Badger } from "../badge/api";
import { CrossScriptMessenger } from "../messaging/api";
import { Notifier } from "../notifications/api";
import { Core } from "../state/core";
import { GitHubLoader } from "../state/github-loader";
import { Store } from "../storage/api";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests(
  store: Store,
  githubLoader: GitHubLoader,
  notifier: Notifier,
  badger: Badger,
  messenger: CrossScriptMessenger
) {
  const core = new Core(store, githubLoader, notifier, badger, messenger);
  await core.load();
  if (!core.token) {
    return;
  }
  await core.refreshPullRequests();
}
