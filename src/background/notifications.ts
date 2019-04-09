import { chromeApi } from "../chrome";
import { PullRequest } from "../state/storage/last-check";

/**
 * Shows a notification if the pull request is new.
 */
export function showNotification(pullRequest: PullRequest) {
  // We set the notification ID to the URL so that we simply cannot have duplicate
  // notifications about the same pull request and we can easily open a browser tab
  // to this pull request just by knowing the notification ID.
  const notificationId = pullRequest.htmlUrl;

  // Chrome supports requireInteraction, but it crashes Firefox.
  const supportsRequireInteraction = navigator.userAgent.toLowerCase().indexOf('firefox') === -1;
  chromeApi.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "images/GitHub-Mark-120px-plus.png",
    title: "New pull request",
    message: pullRequest.title,
    ...(supportsRequireInteraction ? {requireInteraction: true} : {})
  });
}

export function onNotificationClicked(notificationId: string) {
  // Notification IDs are always pull request URLs (see above).
  window.open(notificationId);
  chromeApi.notifications.clear(notificationId);
}
