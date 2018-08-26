import { getGitHubApiToken } from "./auth";
import { PullRequest } from "./github/load-all-pull-requests";
import { loadPullRequestsRequiringReview } from "./github/loader";

// This is the background script of the Chrome extension.

const CHECK_PULL_REQUESTS_ALARM_KEY = "check-pull-requests";

// Beause it isn't a persistent background script, we cannot simply use
// setInterval() to schedule regular checks for new pull requests.
// Instead, we set an alarm three minutes.
// IMPORTANT: GitHub API only allows us 50 requests per hour in total.
chrome.alarms.create(CHECK_PULL_REQUESTS_ALARM_KEY, {
  periodInMinutes: 3
});

// When alarm is triggered, call checkPullRequests().
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === CHECK_PULL_REQUESTS_ALARM_KEY) {
    checkPullRequests().catch(console.error);
  }
});

chrome.runtime.onMessage.addListener(message => {
  if (message.kind === "refresh") {
    checkPullRequests().catch(console.error);
  }
});

// Also call checkPullRequests() on install.
chrome.runtime.onInstalled.addListener(() => {
  checkPullRequests().catch(console.error);
});

// Notification IDs are always pull request URLs.
chrome.notifications.onClicked.addListener(notificationId => {
  window.open(notificationId);
  chrome.notifications.clear(notificationId);
});

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
async function checkPullRequests() {
  let error;
  try {
    const token = await getGitHubApiToken();
    const unreviewedPullRequests = await loadPullRequestsRequiringReview(token);
    await saveUnreviewedPullRequests(unreviewedPullRequests);
    await updateBadge(unreviewedPullRequests.size);
    await showNotificationForNewPullRequests(unreviewedPullRequests);
    error = null;
  } catch (e) {
    error = e;
    await showBadgeError();
  }
  chrome.storage.local.set({
    error: error ? error.message : null
  });
}

/**
 * Saves the list of unreviewed pull requests so that they can be shown in the popup.
 */
async function saveUnreviewedPullRequests(pullRequests: Set<PullRequest>) {
  await new Promise(resolve => {
    chrome.storage.local.set(
      {
        unreviewedPullRequests: Array.from(pullRequests)
      },
      resolve
    );
  });
}

/**
 * Updates the unread PR count in the Chrome extension badge, as well as its color.
 */
function updateBadge(prCount: number) {
  chrome.browserAction.setBadgeText({
    text: "" + prCount
  });
  chrome.browserAction.setBadgeBackgroundColor({
    color: prCount === 0 ? "#4d4" : "#f00"
  });
}

/**
 * Shows an error in the Chrome extension badge.
 */
function showBadgeError() {
  chrome.browserAction.setBadgeText({
    text: "!"
  });
  chrome.browserAction.setBadgeBackgroundColor({
    color: "#000"
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
 * Shows a notification if the pull request is new.
 */
function showNotification(pullRequest: PullRequest) {
  // We set the notification ID to the URL so that we simply cannot have duplicate
  // notifications about the same pull request and we can easily open a browser tab
  // to this pull request just by knowing the notification ID.
  const notificationId = pullRequest.html_url;
  chrome.notifications.create(notificationId, {
    type: "basic",
    iconUrl: "images/GitHub-Mark-120px-plus.png",
    title: "New pull request",
    message: pullRequest.title,
    requireInteraction: true
  });
}

/**
 * Records the pull requests we saw this time, so that we don't show a notification
 * next time.
 */
async function recordSeenPullRequests(pullRequests: Set<PullRequest>) {
  chrome.storage.local.set({
    lastSeenPullRequests: Array.from(pullRequests).map(p => p.html_url)
  });
}

/**
 * Returns a list of pull request URLs that required attention last time we checked.
 */
function getLastSeenPullRequestsUrls(): Promise<string[]> {
  return new Promise(resolve => {
    chrome.storage.local.get(["lastSeenPullRequests"], result => {
      resolve(result.lastSeenPullRequests || []);
    });
  });
}
