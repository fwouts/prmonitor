import { Badger } from "../badge/api";
import { buildBadger } from "../badge/implementation";
import { ChromeApi, chromeApiSingleton } from "../chrome";
import { CrossScriptMessenger } from "../messaging/api";
import { buildMessenger } from "../messaging/implementation";
import { Notifier } from "../notifications/api";
import { buildNotifier } from "../notifications/implementation";
import { GitHubLoader, githubLoaderSingleton } from "../state/github-loader";
import { Store } from "../storage/api";
import { buildStore } from "../storage/implementation";
import { checkPullRequests } from "./check-pull-requests";

// This is the entry point of the background script of the Chrome extension.
console.debug("Background entry point running...");
background(
  chromeApiSingleton,
  buildStore(chromeApiSingleton),
  githubLoaderSingleton,
  buildNotifier(chromeApiSingleton),
  buildBadger(chromeApiSingleton),
  buildMessenger(chromeApiSingleton)
);

function background(
  chromeApi: ChromeApi,
  store: Store,
  githubLoader: GitHubLoader,
  notifier: Notifier,
  badger: Badger,
  messenger: CrossScriptMessenger
) {
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

  messenger.listen(message => {
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

  notifier.registerClickListener();

  // Auto-update as soon as possible.
  chromeApi.runtime.onUpdateAvailable.addListener(() => {
    console.debug("Update available");
    chrome.runtime.reload();
  });

  async function triggerRefresh() {
    checkPullRequests(store, githubLoader, notifier, badger, messenger).catch(
      console.error
    );
  }
}
