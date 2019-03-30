import { PullRequest } from "../github/api/pull-requests";
import { loadPullRequestsRequiringReview } from "../github/loader";
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
    if (store.github.tokenValue.kind !== "provided") {
      return;
    }
    const unreviewedPullRequests = await loadPullRequestsRequiringReview(
      store.github.tokenValue.token
    );
    await store.github.setUnreviewedPullRequests(unreviewedPullRequests);
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
    if (!store.github.lastSeenPullRequestUrls.has(pullRequest.html_url)) {
      console.log(`Showing ${pullRequest.html_url}`);
      showNotification(pullRequest);
    } else {
      console.log(`Filtering ${pullRequest.html_url}`);
    }
  }
  store.github.setLastSeenPullRequests(pullRequests);
}
