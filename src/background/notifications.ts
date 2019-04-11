import { ChromeApi } from "../chrome";
import { PullRequest } from "../state/storage/last-check";

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
export async function showNotificationForNewPullRequests(
  chromeApi: ChromeApi,
  unreviewedPullRequests: PullRequest[],
  notifiedPullRequestUrls: Set<string>
) {
  if (!unreviewedPullRequests) {
    // Do nothing.
    return;
  }
  for (const pullRequest of unreviewedPullRequests) {
    if (!notifiedPullRequestUrls.has(pullRequest.htmlUrl)) {
      console.log(`Showing ${pullRequest.htmlUrl}`);
      showNotification(chromeApi, pullRequest);
    } else {
      console.log(`Filtering ${pullRequest.htmlUrl}`);
    }
  }
}

/**
 * Shows a notification if the pull request is new.
 */
function showNotification(chromeApi: ChromeApi, pullRequest: PullRequest) {
  // We set the notification ID to the URL so that we simply cannot have duplicate
  // notifications about the same pull request and we can easily open a browser tab
  // to this pull request just by knowing the notification ID.
  const notificationId = pullRequest.htmlUrl;

  // Chrome supports requireInteraction, but it crashes Firefox.
  const supportsRequireInteraction =
    navigator.userAgent.toLowerCase().indexOf("firefox") === -1;
  chromeApi.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "images/GitHub-Mark-120px-plus.png",
    title: "New pull request",
    message: pullRequest.title,
    ...(supportsRequireInteraction ? { requireInteraction: true } : {})
  });
}

export function onNotificationClicked(
  chromeApi: ChromeApi,
  notificationId: string
) {
  // Notification IDs are always pull request URLs (see above).
  window.open(notificationId);
  chromeApi.notifications.clear(notificationId);
}
