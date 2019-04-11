import { Badger } from "./badge/api";
import { buildBadger } from "./badge/implementation";
import { ChromeApi, chromeApiSingleton } from "./chrome";
import { CrossScriptMessenger } from "./messaging/api";
import { buildMessenger } from "./messaging/implementation";
import { Notifier } from "./notifications/api";
import { buildNotifier } from "./notifications/implementation";
import { Core } from "./state/core";
import { GitHubLoader, githubLoaderSingleton } from "./state/github-loader";
import { Store } from "./storage/api";
import { buildStore } from "./storage/implementation";

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
  selfUpdateAsap(chromeApi);
  refreshOnUpdate(chromeApi, triggerRefresh);
  refreshRegulary(chromeApi, triggerRefresh);
  refreshOnDemand(messenger, triggerRefresh);
  notifier.registerClickListener();

  async function triggerRefresh() {
    const core = new Core(store, githubLoader, notifier, badger, messenger);
    await core.load();
    if (!core.token) {
      return;
    }
    await core.refreshPullRequests();
  }
}

/**
 * Automatically reloads the extension as soon as an update is available.
 */
function selfUpdateAsap(chromeApi: ChromeApi) {
  chromeApi.runtime.onUpdateAvailable.addListener(() => {
    console.debug("Update available");
    chrome.runtime.reload();
  });
}

/**
 * Refreshes pull requests when the extension is installed or updated.
 */
function refreshOnUpdate(
  chromeApi: ChromeApi,
  triggerRefresh: () => Promise<void>
) {
  chromeApi.runtime.onInstalled.addListener(() => {
    console.debug("Extension installed");
    triggerRefresh().catch(console.error);
  });
}

/**
 * Refreshes pull requests at regular intervals.
 */
function refreshRegulary(
  chromeApi: ChromeApi,
  triggerRefresh: () => Promise<void>
) {
  chromeApi.alarms.create({
    periodInMinutes: 3
  });
  chromeApi.alarms.onAlarm.addListener(alarm => {
    console.debug("Alarm triggered", alarm);
    triggerRefresh().catch(console.error);
  });
}

/**
 * Refreshes pull requests when requested by the user (e.g. after entering a new token).
 */
function refreshOnDemand(
  messenger: CrossScriptMessenger,
  triggerRefresh: () => Promise<void>
) {
  messenger.listen(message => {
    console.debug("Message received", message);
    if (message.kind === "refresh") {
      triggerRefresh().catch(console.error);
    }
  });
}
