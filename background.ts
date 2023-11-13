import { ChromeApi } from "./src/chrome/api";
import { chromeApiSingleton } from "./src/chrome/implementation";
import { buildEnvironment } from "./src/environment/implementation";
import { CrossScriptMessenger } from "./src/messaging/api";
import { Core } from "./src/state/core";

// This is the entry point of the service worker of the Chrome extension.
console.debug("Service worker running...");

const chromeApi = chromeApiSingleton;
const env = buildEnvironment(chromeApiSingleton);
const core = new Core(env);

selfUpdateAsap(chromeApi);
refreshOnUpdate(chromeApi);
refreshRegulary(chromeApi);
refreshOnDemand(env.messenger);

async function triggerRefresh() {
  const result = await chromeApi.storage.session.get(["refreshing"]);
  const refreshing = result?.refreshing ?? false;
  console.log('devon', 'triggerRefresh', result, refreshing);
  if (refreshing) {
    return;
  }
  try {
    console.log('devon', 'triggerRefresh', 'load');
    chromeApi.storage.session.set({ refreshing: true });
    await core.load();
    if (!core.token) {
      return;
    }
    await core.refreshPullRequests();
  } finally {
    chromeApi.storage.session.set({ refreshing: false });
  }
}

/**
 * Automatically reloads the extension as soon as an update is available.
 */
function selfUpdateAsap(chromeApi: ChromeApi) {
  chromeApi.runtime.onUpdateAvailable.addListener(() => {
    console.debug("Update available");
    chromeApi.runtime.reload();
  });
}

/**
 * Refreshes pull requests when the extension is installed or updated.
 */
function refreshOnUpdate(chromeApi: ChromeApi) {
  chromeApi.runtime.onInstalled.addListener(() => {
    console.debug("Extension installed");
    triggerRefresh().catch(console.error);
  });
}

/**
 * Refreshes pull requests at regular intervals.
 */
function refreshRegulary(chromeApi: ChromeApi) {
  chromeApi.alarms.create({
    periodInMinutes: 10,
  });
  chromeApi.alarms.onAlarm.addListener((alarm) => {
    console.debug("Alarm triggered", alarm);
    triggerRefresh().catch(console.error);
  });
}

/**
 * Refreshes pull requests when requested by the user (e.g. after entering a new token).
 */
function refreshOnDemand(messenger: CrossScriptMessenger) {
  messenger.listen((message) => {
    console.debug("Message received", message);
    if (message.kind === "refresh") {
      triggerRefresh().catch(console.error);
    }
  });
}
