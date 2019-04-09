import { chromeApi } from "./chrome";
import { PullRequest } from "./state/storage/last-check";

/**
 * Updates the unread PR count in the Chrome extension badge, as well as its color.
 */
export function updateBadge(unreviewedPullRequests: PullRequest[]) {
  chromeApi.browserAction.setBadgeText({
    text: "" + unreviewedPullRequests.length
  });
  chromeApi.browserAction.setBadgeBackgroundColor({
    color: unreviewedPullRequests.length === 0 ? "#4d4" : "#f00"
  });
}

/**
 * Shows an error in the Chrome extension badge.
 */
export function showBadgeError() {
  chromeApi.browserAction.setBadgeText({
    text: "!"
  });
  chromeApi.browserAction.setBadgeBackgroundColor({
    color: "#000"
  });
}
