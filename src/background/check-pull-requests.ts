import { PullRequest } from "../state/storage/last-check";
import { store } from "../state/store";
import { showBadgeError, updateBadge } from "./badge";
import { showNotification } from "./notifications";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests() {
  let error;
  try {
    await store.github.start();
    if (!store.github.token) {
      return;
    }
    await store.github.refreshPullRequests();
    const unreviewedPullRequests = store.github.unreviewedPullRequests;
    if (!unreviewedPullRequests) {
      throw new Error(`Pull requests should have been loaded.`);
    }
    await updateBadge(unreviewedPullRequests.length);
    await showNotificationForNewPullRequests(unreviewedPullRequests);
    error = null;
  } catch (e) {
    error = e;
    await showBadgeError();
  }
  store.github.setError(error ? error.message : null);
}

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
async function showNotificationForNewPullRequests(pullRequests: PullRequest[]) {
  for (const pullRequest of pullRequests) {
    if (!store.github.lastSeenPullRequestUrls.has(pullRequest.htmlUrl)) {
      console.log(`Showing ${pullRequest.htmlUrl}`);
      showNotification(pullRequest);
    } else {
      console.log(`Filtering ${pullRequest.htmlUrl}`);
    }
  }
  store.github.setLastSeenPullRequests(pullRequests);
}
