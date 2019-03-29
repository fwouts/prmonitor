import { chromeApi } from "../chrome";

/**
 * Updates the unread PR count in the Chrome extension badge, as well as its color.
 */
export function updateBadge(prCount: number) {
  chromeApi.browserAction.setBadgeText({
    text: "" + prCount
  });
  chromeApi.browserAction.setBadgeBackgroundColor({
    color: prCount === 0 ? "#4d4" : "#f00"
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
