import { ChromeApi, chromeApiSingleton } from "../chrome";
import { checkPullRequests } from "./check-pull-requests";
import { onNotificationClicked } from "./notifications";

// This is the entry point of the background script of the Chrome extension.
console.debug("Background entry point running...");
background(chromeApiSingleton);

function background(chromeApi: ChromeApi) {
  // Beause it isn't a persistent background script, we cannot simply use
  // setInterval() to schedule regular checks for new pull requests.
  // Instead, we set an alarm three minutes.
  // IMPORTANT: GitHub API only allows us 50 requests per hour in total.
  chromeApi.alarms.create({
    periodInMinutes: 3
  });

  // When alarm is triggered, call checkPullRequests().
  chromeApi.alarms.onAlarm.addListener(alarm => {
    console.debug("Alarm triggered", alarm);
    triggerRefresh();
  });

  chromeApi.runtime.onMessage.addListener(message => {
    console.debug("Message received", message);
    if (message.kind === "refresh") {
      triggerRefresh();
    }
  });

  // Also call checkPullRequests() on install.
  chromeApi.runtime.onInstalled.addListener(() => {
    console.debug("Extension installed");
    triggerRefresh();
  });

  chromeApi.notifications.onClicked.addListener(notificationId =>
    onNotificationClicked(chromeApi, notificationId)
  );

  // Auto-update as soon as possible.
  chromeApi.runtime.onUpdateAvailable.addListener(() => {
    console.debug("Update available");
    chrome.runtime.reload();
  });

  async function triggerRefresh() {
    checkPullRequests(chromeApi).catch(console.error);
  }
}
