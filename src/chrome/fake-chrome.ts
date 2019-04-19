import { ChromeApi, ChromeStorageItems } from "./api";

/**
 * A fake implementation of the Chrome extension API to allow development
 * outside of a Chrome extension.
 */
export const fakeChrome = (<Partial<ChromeApi>>{
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
    sendMessage(message: any) {
      console.log("chrome.runtime.sendMessage", message);
    },
    onMessage: {
      addListener(listener: any) {
        console.log("chrome.runtime.onMessage.addListener", listener);
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
      addListener(listener: any) {
        console.log("chrome.notifications.onClicked.addListener", listener);
      }
    }
  },
  permissions: {
    request(_permissions, callback) {
      if (callback) {
        callback(true);
      }
    }
  },
  storage: {
    // To simulate chrome.storage.local, we simply fall back to the localStorage API.
    local: {
      set(items: ChromeStorageItems, callback) {
        for (const [key, value] of Object.entries(items)) {
          localStorage.setItem(key, value);
        }
        if (callback) {
          callback();
        }
      },
      get(keys: string[], callback: (items: ChromeStorageItems) => void) {
        callback(
          keys.reduce<ChromeStorageItems>((acc, key) => {
            acc[key] = localStorage.getItem(key);
            return acc;
          }, {})
        );
      }
    }
  },
  tabs: {
    query(_queryInfo, callback) {
      callback([]);
    }
  }
}) as ChromeApi;
