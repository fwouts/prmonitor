import { buildTestingEnvironment } from "../environment/testing/fake";
import {
  MuteConfiguration,
  NOTHING_MUTED
} from "../storage/mute-configuration";
import { Core } from "./core";

describe("Core", () => {
  it("loads correctly without token", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);

    // No token stored.
    env.store.token.load.mockReturnValue(Promise.resolve(null));

    // Other things are stored, they should be ignored.
    env.store.lastError.load.mockReturnValue(Promise.resolve("error"));
    env.store.lastCheck.load.mockReturnValue(
      Promise.resolve({
        userLogin: "fwouts",
        repos: [],
        openPullRequests: []
      })
    );
    env.store.notifiedPullRequests.load.mockReturnValue(
      Promise.resolve(["a", "b", "c"])
    );
    env.store.muteConfiguration.load.mockReturnValue(
      Promise.resolve({
        mutedPullRequests: [
          {
            repo: {
              owner: "zenclabs",
              name: "prmonitor"
            },
            number: 1,
            until: {
              kind: "next-update",
              mutedAtTimestamp: 123
            }
          }
        ]
      })
    );

    // Initialise.
    await core.load();

    expect(core.token).toBeNull();
    expect(core.lastError).toBeNull();
    expect(core.refreshing).toBe(false);
    expect(core.loadedState).toBeNull();
    expect(core.muteConfiguration).toEqual(NOTHING_MUTED);
    expect(core.notifiedPullRequestUrls.size).toBe(0);
  });

  it("loads with token", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);

    // A valid token is stored.
    env.store.token.load.mockReturnValue(Promise.resolve("valid-token"));

    // Other things are stored, they should be restored.
    const state = {
      userLogin: "fwouts",
      repos: [],
      openPullRequests: []
    };
    const notifiedPullRequestUrls = ["a", "b", "c"];
    const muteConfiguration: MuteConfiguration = {
      mutedPullRequests: [
        {
          repo: {
            owner: "zenclabs",
            name: "prmonitor"
          },
          number: 1,
          until: {
            kind: "next-update",
            mutedAtTimestamp: 123
          }
        }
      ]
    };
    env.store.lastError.load.mockReturnValue(Promise.resolve("error"));
    env.store.lastCheck.load.mockReturnValue(Promise.resolve(state));
    env.store.notifiedPullRequests.load.mockReturnValue(
      Promise.resolve(notifiedPullRequestUrls)
    );
    env.store.muteConfiguration.load.mockReturnValue(
      Promise.resolve(muteConfiguration)
    );

    // Initialise.
    await core.load();

    expect(core.token).toEqual("valid-token");
    expect(core.lastError).toEqual("error");
    expect(core.refreshing).toBe(false);
    expect(core.loadedState).toEqual(state);
    expect(core.muteConfiguration).toEqual(muteConfiguration);
    expect(Array.from(core.notifiedPullRequestUrls)).toEqual(
      notifiedPullRequestUrls
    );
  });

  it("reloads when receiving a load message", () => {
    const env = buildTestingEnvironment();

    // Initialize the core.
    // TODO: Consider adding the listener in a separate init() method.
    new Core(env);
    env.messenger.trigger({
      kind: "reload"
    });
    expect(env.store.token.load).toHaveBeenCalled();
  });

  it("doesn't reload on non-reload message", () => {
    const env = buildTestingEnvironment();

    // Initialize the core.
    // TODO: Consider adding the listener in a separate init() method.
    new Core(env);
    env.messenger.trigger({
      kind: "refresh"
    });
    expect(env.store.token.load).not.toHaveBeenCalled();
  });

  it("resets state and triggers a refresh when a new token is set", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);

    // A valid token is stored.
    env.store.token.load.mockReturnValue(Promise.resolve("token-fwouts"));
    const state = {
      userLogin: "fwouts",
      repos: [],
      openPullRequests: []
    };
    env.store.lastCheck.load.mockReturnValue(Promise.resolve(state));

    // Initialise.
    await core.load();
    expect(core.loadedState && core.loadedState.userLogin).toBe("fwouts");

    await core.setNewToken("token-kevin");
    expect(env.store.token.save).toBeCalledWith("token-kevin");
    expect(env.store.lastError.save).toBeCalledWith(null);
    expect(env.store.notifiedPullRequests.save).toBeCalledWith([]);
    expect(env.store.lastCheck.save).toBeCalledWith(null);
    expect(env.store.muteConfiguration.save).toBeCalledWith(NOTHING_MUTED);
    expect(env.messenger.sent).toEqual([{ kind: "refresh" }]);
  });

  it.todo("doesn't refresh when not authenticated");
  it.todo("doesn't refresh when offline");
  it.todo("updates badge when it starts refreshing");
  it.todo("updates badge and error when it finishes refreshing successfully");
  it.todo("updates badge and error when it fails to refresh");
  it.todo("notifies of new pull requests and saves notified state");
  it.todo("updates badge after muting a PR");

  it("doesn't duplicate muted pull requests", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);
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
