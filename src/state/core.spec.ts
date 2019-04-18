import { buildTestingEnvironment } from "../environment/testing/fake";
import { Core } from "./core";

describe("Core", () => {
  it("loads without token", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);
    env.store.token.load.mockReturnValue(Promise.resolve(null));
    await core.load();
  });

  it("loads with token", async () => {
    const env = buildTestingEnvironment();
    const core = new Core(env);
    env.store.token.load.mockReturnValue(Promise.resolve("abc"));
    await core.load();
  });

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
