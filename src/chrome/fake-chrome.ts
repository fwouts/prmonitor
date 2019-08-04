import { RecursivePartial } from "../testing/recursive-partial";
import { ChromeApi, ChromeStorageItems } from "./api";

/**
 * A fake implementation of the Chrome extension API to allow development
 * outside of a Chrome extension.
 */
const partialFakeChrome: RecursivePartial<ChromeApi> = {
  browserAction: {
    setBadgeText(details: chrome.browserAction.BadgeTextDetails) {
      console.log("chrome.browserAction.setBadgeText", details);
    },
    setBadgeBackgroundColor(
      details: chrome.browserAction.BadgeBackgroundColorDetails
    ) {
      console.log("chrome.browserAction.setBadgeBackgroundColor", details);
    }
  },
  runtime: {
    // Sending a message won't do anything, but we can at least log it.
    sendMessage(message: unknown) {
      console.log("chrome.runtime.sendMessage", message);
    },
    onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: chrome.runtime.MessageSender,
          sendResponse: (response?: unknown) => void
        ) => void
      ) {
        console.log("chrome.runtime.onMessage.addListener", callback);
      }
    }
  },
  notifications: {
    create(
      notificationId: string,
      options: chrome.notifications.NotificationOptions
    ) {
      console.log("chrome.notifications.create", notificationId, options);
    },
    onClicked: {
      addListener(callback: (notificationId: string) => void) {
        console.log("chrome.notifications.onClicked.addListener", callback);
      }
    }
  },
  permissions: {
    request(
      _permissions: chrome.permissions.Permissions,
      callback?: (granted: boolean) => void
    ) {
      if (callback) {
        callback(true);
      }
    },
    getAll(callback: (permissions: chrome.permissions.Permissions) => void) {
      callback({});
    }
  },
  storage: {
    // To simulate chrome.storage.local, we simply fall back to the localStorage API.
    local: {
      set(items: ChromeStorageItems, callback?: () => void) {
        for (const [key, value] of Object.entries(items)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
        if (callback) {
          callback();
        }
      },
      get(keys: string[], callback: (items: ChromeStorageItems) => void) {
        callback(
          keys.reduce<ChromeStorageItems>((acc, key) => {
            const json = localStorage.getItem(key);
            acc[key] = json ? JSON.parse(json) : null;
            return acc;
          }, {})
        );
      }
    }
  },
  tabs: {
    query(
      _queryInfo: chrome.tabs.QueryInfo,
      callback: (result: chrome.tabs.Tab[]) => void
    ) {
      callback([]);
    },
    create(properties: chrome.tabs.CreateProperties) {
      window.open(properties.url);
    }
  },
  windows: {
    update(windowId: number, updateInfo: chrome.windows.UpdateInfo) {
      console.log("chrome.windows.update", windowId, updateInfo);
    }
  }
};

export const fakeChrome = partialFakeChrome as ChromeApi;
