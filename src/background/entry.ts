import { chromeApi } from "../chrome";
import { checkPullRequests } from "./check-pull-requests";
import { onNotificationClicked } from "./notifications";

// This is the entry point of the background script of the Chrome extension.

const CHECK_PULL_REQUESTS_ALARM_KEY = "check-pull-requests";

// Beause it isn't a persistent background script, we cannot simply use
// setInterval() to schedule regular checks for new pull requests.
// Instead, we set an alarm three minutes.
// IMPORTANT: GitHub API only allows us 50 requests per hour in total.
chromeApi.alarms.create(CHECK_PULL_REQUESTS_ALARM_KEY, {
  periodInMinutes: 3
});

// When alarm is triggered, call checkPullRequests().
chromeApi.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === CHECK_PULL_REQUESTS_ALARM_KEY) {
    triggerRefresh();
  }
});

chromeApi.runtime.onMessage.addListener(message => {
  if (message.kind === "refresh") {
    triggerRefresh();
  }
});

// Also call checkPullRequests() on install.
chromeApi.runtime.onInstalled.addListener(triggerRefresh);

chromeApi.notifications.onClicked.addListener(onNotificationClicked);

async function triggerRefresh() {
  checkPullRequests().catch(console.error);
}
