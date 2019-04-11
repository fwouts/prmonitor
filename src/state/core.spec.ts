import { Badger, BadgeState } from "../badge/api";
import { ChromeApi, ChromeStorageItems } from "../chrome";
import { Notifier } from "../notifications/api";
import { Store, ValueStorage } from "../storage/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { Core } from "./core";

describe("Core", () => {
  it("does something", async () => {
    const chrome = fakeChrome();
    const store = mockStore();
    const githubLoader = jest.fn();
    const notifier = fakeNotifier();
    const badger = fakeBadger();
    const core = new Core(
      chrome.chromeApi,
      store,
      githubLoader,
      notifier,
      badger
    );
    await core.load();
  });
});

function mockStore(): Store {
  return {
    lastError: mockStorage<string | null>(),
    lastCheck: mockStorage<LoadedState | null>(),
    muteConfiguration: mockStorage<MuteConfiguration>(),
    notifiedPullRequests: mockStorage<string[]>(),
    token: mockStorage<string | null>()
  };
}

function mockStorage<T>(): ValueStorage<T> {
  return {
    load: jest.fn(),
    save: jest.fn()
  };
}

function fakeNotifier() {
  const notified: Array<{
    unreviewedPullRequests: PullRequest[];
    notifiedPullRequestUrls: Set<string>;
  }> = [];
  const notifier: Notifier = {
    notify(unreviewedPullRequests, notifiedPullRequestUrls) {
      notified.push({
        unreviewedPullRequests,
        notifiedPullRequestUrls
      });
    },
    registerClickListener: jest.fn()
  };
  return {
    ...notifier,
    notified
  };
}

function fakeBadger() {
  const updated: BadgeState[] = [];
  const badger: Badger = {
    update(state) {
      updated.push(state);
    }
  };
  return {
    ...badger,
    updated
  };
}

function fakeChrome() {
  const badge = {
    text: "",
    color: <string | chrome.browserAction.ColorArray>"default"
  };
  const fakeLocalStorage: ChromeStorageItems = {};
  const messageListeners: any[] = [];
  const sentMessages: any[] = [];
  const chromeApi = (<Partial<ChromeApi>>{
    browserAction: {
      setBadgeText(details: chrome.browserAction.BadgeTextDetails) {
        badge.text = details.text;
      },
      setBadgeBackgroundColor(
        details: chrome.browserAction.BadgeBackgroundColorDetails
      ) {
        badge.color = details.color;
      }
    },
    runtime: {
      sendMessage(message: any) {
        sentMessages.push(message);
      },
      onMessage: {
        addListener(listener: any) {
          messageListeners.push(listener);
        }
      }
    },
    storage: {
      local: {
        set(items: ChromeStorageItems, callback) {
          for (const [key, value] of Object.entries(items)) {
            fakeLocalStorage[key] = value;
          }
          if (callback) {
            callback();
          }
        },
        get(keys: string[], callback: (items: ChromeStorageItems) => void) {
          callback(
            keys.reduce<ChromeStorageItems>((acc, key) => {
              acc[key] = fakeLocalStorage[key];
              return acc;
            }, {})
          );
        }
      }
    }
  }) as ChromeApi;
  return {
    chromeApi,
    fakeLocalStorage,
    sentMessages
  };
}
