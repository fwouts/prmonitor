import { fakeChromeApi } from "./fake-chrome-api";

// This file exists to facilitate development.
//
// In its normal running environment, the extension will always have access to
// the global `chrome` object. However in development, it is much more
// convenient to be able to build and run pages on their own, outside of the
// Chrome extension environment.
//
// This indirection allows us to do just that.

export let chromeApiSingleton: ChromeApi;

if (!chrome.extension && process.env.NODE_ENV === "development") {
  // We're developing outside of the Chrome extension environment.
  // Create a partial fake covering the APIs we need.
  chromeApiSingleton = fakeChromeApi;
} else {
  chromeApiSingleton = chrome;
}

export type ChromeApi = typeof chrome;

export interface ChromeStorageItems {
  [key: string]: any;
}
