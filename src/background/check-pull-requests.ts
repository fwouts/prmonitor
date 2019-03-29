import { chromeApi } from "../chrome";
import { PullRequest } from "../github/load-all-pull-requests";
import { loadPullRequestsRequiringReview } from "../github/loader";
import { TokenValue } from "../state/github";
import { showBadgeError, updateBadge } from "./badge";
import { showNotification } from "./notifications";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests(tokenValue: TokenValue) {
  if (tokenValue.kind !== "provided") {
    return;
  }
  let error;
  try {
    const unreviewedPullRequests = await loadPullRequestsRequiringReview(
      tokenValue.token
    );
    await saveUnreviewedPullRequests(unreviewedPullRequests);
    await updateBadge(unreviewedPullRequests.size);
    await showNotificationForNewPullRequests(unreviewedPullRequests);
    error = null;
  } catch (e) {
    error = e;
    await showBadgeError();
  }
  chromeApi.storage.local.set({
    error: error ? error.message : null
  });
}

/**
 * Saves the list of unreviewed pull requests so that they can be shown in the popup.
 */
async function saveUnreviewedPullRequests(pullRequests: Set<PullRequest>) {
  await new Promise(resolve => {
    chromeApi.storage.local.set(
      {
        unreviewedPullRequests: Array.from(pullRequests)
      },
      resolve
    );
  });
}

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
async function showNotificationForNewPullRequests(
  pullRequests: Set<PullRequest>
) {
  const lastSeenPullRequestUrls = new Set(await getLastSeenPullRequestsUrls());
  for (const pullRequest of pullRequests) {
    if (!lastSeenPullRequestUrls.has(pullRequest.html_url)) {
      console.log(`Showing ${pullRequest.html_url}`);
      showNotification(pullRequest);
    } else {
      console.log(`Filtering ${pullRequest.html_url}`);
    }
  }
  recordSeenPullRequests(pullRequests);
}

/**
 * Records the pull requests we saw this time, so that we don't show a notification
 * next time.
 */
async function recordSeenPullRequests(pullRequests: Set<PullRequest>) {
  chromeApi.storage.local.set({
    lastSeenPullRequests: Array.from(pullRequests).map(p => p.html_url)
  });
}

/**
 * Returns a list of pull request URLs that required attention last time we checked.
 */
function getLastSeenPullRequestsUrls(): Promise<string[]> {
  return new Promise(resolve => {
    chromeApi.storage.local.get(["lastSeenPullRequests"], result => {
      resolve(result.lastSeenPullRequests || []);
    });
  });
}
