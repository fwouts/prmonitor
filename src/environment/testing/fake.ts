import { Badger, BadgeState } from "../../badge/api";
import { CrossScriptMessenger, Message } from "../../messaging/api";
import { Notifier } from "../../notifications/api";
import { LoadedState, PullRequest } from "../../storage/loaded-state";
import {
  MuteConfiguration,
  NOTHING_MUTED
} from "../../storage/mute-configuration";

export function buildTestingEnvironment() {
  const store = mockStore();
  const githubLoader = jest.fn();
  const notifier = fakeNotifier();
  const badger = fakeBadger();
  const messenger = fakeMessenger();
  return {
    store,
    githubLoader,
    notifier,
    badger,
    messenger
  };
}

function mockStore() {
  return {
    lastError: mockStorage<string | null>(null),
    lastCheck: mockStorage<LoadedState | null>(null),
    muteConfiguration: mockStorage<MuteConfiguration>(NOTHING_MUTED),
    notifiedPullRequests: mockStorage<string[]>([]),
    token: mockStorage<string | null>(null)
  };
}

function mockStorage<T>(defaultValue: T) {
  return {
    load: jest.fn().mockReturnValue(defaultValue),
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
