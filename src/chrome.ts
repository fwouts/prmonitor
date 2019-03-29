// This file exists to facilitate development.
//
// In its normal running environment, the extension will always have access to
// the global `chrome` object. However in development, it is much more
// convenient to be able to build and run pages on their own, outside of the
// Chrome extension environment.
//
// This indirection allows us to do just that.

export let chromeApi: Chrome;

if (!chrome.extension && process.env.NODE_ENV === "development") {
  // We're developing outside of the Chrome extension environment.
  // Create a partial fake covering the APIs we need.
  chromeApi = (<Partial<Chrome>>{
    runtime: {
      // Sending a message won't do anything, but we can at least log it.
      sendMessage(message: any) {
        console.log("chrome.sendMessage", message);
      }
    },
    storage: {
      // To simulate chrome.storage.local, we simply fall back to the localStorage API.
      local: {
        set(items: StorageItems, callback) {
          for (const [key, value] of Object.entries(items)) {
            localStorage.setItem(key, value);
          }
          if (callback) {
            callback();
          }
        },
        get(keys: string[], callback: (items: StorageItems) => void) {
          callback(
            keys.reduce<StorageItems>((acc, key) => {
              acc[key] = localStorage.getItem(key);
              return acc;
            }, {})
          );
        }
      }
    }
  }) as Chrome;
} else {
  chromeApi = chrome;
}

type Chrome = typeof chrome;

interface StorageItems {
  [key: string]: any;
}
