import { ChromeApi } from "../chrome/api";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { Notifier } from "./api";

export function buildNotifier(chromeApi: ChromeApi): Notifier {
  return {
    notify(pullRequests, notifiedPullRequestUrls) {
      showNotificationForNewPullRequests(
        chromeApi,
        pullRequests,
        notifiedPullRequestUrls
      );
    },
    registerClickListener(clickListener: (pullRequestUrl: string) => void) {
      // Notification IDs are always pull request URLs (see below).
      chromeApi.notifications.onClicked.addListener((notificationId) => {
        clickListener(notificationId);
        chromeApi.notifications.clear(notificationId);
      });
    },
  };
}

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
async function showNotificationForNewPullRequests(
  chromeApi: ChromeApi,
  pullRequests: EnrichedPullRequest[],
  notifiedPullRequestUrls: Set<string>
) {
  for (const pullRequest of pullRequests) {
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
    contextMessage: getContextMessage(pullRequest),
    ...(supportsRequireInteraction ? { requireInteraction: true } : {}),
  });
}

function getTitle(pullRequest: EnrichedPullRequest): string {
  switch (pullRequest.state.kind) {
    case "incoming":
      if (pullRequest.state.newReviewRequested) {
        return "New pull request";
      } else if (pullRequest.state.authorResponded) {
        return `${pullRequest.author?.login || "unknown"} commented`;
      }
      break;
    case "outgoing":
      if (pullRequest.state.approved) {
        return `Pull request approved`;
      } else if (pullRequest.state.changesRequested) {
        return `New changes requested`;
      }
      break;
  }
  throw new Error(`Well, this should never happen.`);
}

function getMessage(pullRequest: EnrichedPullRequest): string {
  return pullRequest.title;
}

function getContextMessage(pullRequest: EnrichedPullRequest): string {
  return `${pullRequest.repoOwner}/${pullRequest.repoName}`;
}
