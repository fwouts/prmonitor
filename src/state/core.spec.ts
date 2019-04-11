import { Badger, BadgeState } from "../badge/api";
import { CrossScriptMessenger, Message } from "../messaging/api";
import { Notifier } from "../notifications/api";
import { Store, ValueStorage } from "../storage/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { Core } from "./core";

describe("Core", () => {
  it("does something", async () => {
    const store = mockStore();
    const githubLoader = jest.fn();
    const notifier = fakeNotifier();
    const badger = fakeBadger();
    const messenger = fakeMessenger();
    const core = new Core(store, githubLoader, notifier, badger, messenger);
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

function fakeMessenger() {
  const sent: Message[] = [];
  const listeners: Array<(message: Message) => void> = [];
  const messenger: CrossScriptMessenger = {
    listen(listener) {
      listeners.push(listener);
    },
    send(message) {
      sent.push(message);
    }
  };
  return {
    ...messenger,
    sent,
    trigger(message: Message) {
      for (const listener of listeners) {
        listener(message);
      }
    }
  };
}
