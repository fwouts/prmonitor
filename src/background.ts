import { ChromeApi } from "./chrome/api";
import { chromeApiSingleton } from "./chrome/implementation";
import { Environment } from "./environment/api";
import { buildEnvironment } from "./environment/implementation";
import { CrossScriptMessenger } from "./messaging/api";
import { Core } from "./state/core";

// This is the entry point of the background script of the Chrome extension.
console.debug("Background entry point running...");
const chromeApi = chromeApiSingleton;
const env = buildEnvironment(chromeApiSingleton);
setUpBackgroundScript(chromeApi, env);

function setUpBackgroundScript(chromeApi: ChromeApi, env: Environment) {
  selfUpdateAsap(chromeApi);
  refreshOnUpdate(chromeApi, triggerRefresh);
  refreshRegulary(chromeApi, triggerRefresh);
  refreshOnDemand(env.messenger, triggerRefresh);
  env.notifier.registerClickListener();

  async function triggerRefresh() {
    const core = new Core(env);
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
