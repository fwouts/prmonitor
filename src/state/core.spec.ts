import { Badger, BadgeState } from "../badge/api";
import { CrossScriptMessenger, Message } from "../messaging/api";
import { Notifier } from "../notifications/api";
import { LoadedState, PullRequest } from "../storage/loaded-state";
import {
  MuteConfiguration,
  NOTHING_MUTED
} from "../storage/mute-configuration";
import { Core } from "./core";

describe("Core", () => {
  it("loads without token", async () => {
    const { store, core } = setUp();
    store.token.load.mockReturnValue(null);
    await core.load();
  });

  it("loads with token", async () => {
    const { store, core } = setUp();
    store.token.load.mockReturnValue("abc");
    await core.load();
  });

  it("doesn't duplicate muted pull requests", async () => {
    const { core } = setUp();
    await core.load();

    // Oh well. This isn't very good, is it?
    //
    // We should have a date helper that we pass around so we can mock it out
    // without replacing a global singleton with a mock. JavaScript, it's all your
    // fault for making it too easy!
    const nowDate = jest.fn();
    Date.now = nowDate;

    // Mute two PRs (on different dates).
    nowDate.mockReturnValue(Date.parse("1 Jan 2019"));
    await core.mutePullRequest({
      repoOwner: "zenclabs",
      repoName: "prmonitor",
      pullRequestNumber: 1
    });
    nowDate.mockReturnValue(Date.parse("5 Jan 2019"));
    await core.mutePullRequest({
      repoOwner: "zenclabs",
      repoName: "prmonitor",
      pullRequestNumber: 2
    });
    // Late on, mute the first PR again
    nowDate.mockReturnValue(Date.parse("8 Jan 2019"));
    await core.mutePullRequest({
      repoOwner: "zenclabs",
      repoName: "prmonitor",
      pullRequestNumber: 1
    });

    expect(core.muteConfiguration.mutedPullRequests).toHaveLength(2);
    expect(core.muteConfiguration.mutedPullRequests[0]).toEqual({
      number: 2,
      repo: {
        name: "prmonitor",
        owner: "zenclabs"
      },
      until: {
        kind: "next-update",
        mutedAtTimestamp: Date.parse("5 Jan 2019")
      }
    });
    expect(core.muteConfiguration.mutedPullRequests[1]).toEqual({
      number: 1,
      repo: {
        name: "prmonitor",
        owner: "zenclabs"
      },
      until: {
        kind: "next-update",
        mutedAtTimestamp: Date.parse("8 Jan 2019")
      }
    });
  });
});

function setUp() {
  const store = mockStore();
  const githubLoader = jest.fn();
  const notifier = fakeNotifier();
  const badger = fakeBadger();
  const messenger = fakeMessenger();
  const core = new Core(store, githubLoader, notifier, badger, messenger);
  return {
    store,
    githubLoader,
    notifier,
    badger,
    messenger,
    core
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
