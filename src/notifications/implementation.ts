import { ChromeApi } from "../chrome/api";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { PullRequestStatus } from "../filtering/status";
import { Notifier } from "./api";

export function buildNotifier(chromeApi: ChromeApi): Notifier {
  return {
    notify(unreviewedPullRequests, notifiedPullRequestUrls) {
      showNotificationForNewPullRequests(
        chromeApi,
        unreviewedPullRequests,
        notifiedPullRequestUrls
      );
    },
    registerClickListener(clickListener: (pullRequestUrl: string) => void) {
      // Notification IDs are always pull request URLs (see below).
      chromeApi.notifications.onClicked.addListener(notificationId => {
        clickListener(notificationId);
        chromeApi.notifications.clear(notificationId);
      });
    }
  };
}

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
async function showNotificationForNewPullRequests(
  chromeApi: ChromeApi,
  unreviewedPullRequests: EnrichedPullRequest[],
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
function showNotification(
  chromeApi: ChromeApi,
  pullRequest: EnrichedPullRequest
) {
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
    title: getTitle(pullRequest),
    message: getMessage(pullRequest),
    ...(supportsRequireInteraction ? { requireInteraction: true } : {})
  });
}

function getTitle(pullRequest: EnrichedPullRequest): string {
  switch (pullRequest.status) {
    case PullRequestStatus.INCOMING_NEW_REVIEW_REQUESTED:
      return "New pull request";
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR:
      return `${pullRequest.author.login} commented`;
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT:
    case PullRequestStatus.INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR:
      return `Pull request updated`;
    default:
      throw new Error(`Well, this should never happen.`);
  }
}

function getMessage(pullRequest: EnrichedPullRequest): string {
  return pullRequest.title;
}
