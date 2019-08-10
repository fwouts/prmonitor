import { buildTestingEnvironment } from "../environment/testing/fake";
import { PullRequestReference, RepoReference } from "../github-api/api";
import {
  addMute,
  MuteConfiguration,
  removeOwnerMute,
  removePullRequestMute,
  removeRepositoryMute
} from "./mute-configuration";

const FAKE_CURRENT_TIME = 3;

const REPO: RepoReference = {
  owner: "zenclabs",
  name: "prmonitor"
};

const PR: PullRequestReference = {
  repo: REPO,
  number: 1
};

const OTHER_PR_SAME_REPO: PullRequestReference = {
  repo: REPO,
  number: 2
};

const OTHER_PR_DIFFERENT_REPO: PullRequestReference = {
  repo: {
    owner: "zenclabs",
    name: "spot"
  },
  number: 1
};

const OTHER_PR_DIFFERENT_OWNER: PullRequestReference = {
  repo: {
    owner: "fwouts",
    name: "prmonitor"
  },
  number: 1
};

describe("MuteConfiguration", () => {
  describe("addMute", () => {
    test("next-update", () => {
      const env = buildTestingEnvironment();
      env.currentTime = FAKE_CURRENT_TIME;
      expect(addMute(env, createEmptyConfig(), PR, "next-update")).toEqual({
        mutedPullRequests: [
          {
            ...PR,
            until: {
              kind: "next-update",
              mutedAtTimestamp: FAKE_CURRENT_TIME
            }
          }
        ],
        ignored: {}
      });
    });
    test("1-hour", () => {
      const env = buildTestingEnvironment();
      env.currentTime = FAKE_CURRENT_TIME;
      expect(addMute(env, createEmptyConfig(), PR, "1-hour")).toEqual({
        mutedPullRequests: [
          {
            ...PR,
            until: {
              kind: "specific-time",
              unmuteAtTimestamp: FAKE_CURRENT_TIME + 3600 * 1000
            }
          }
        ],
        ignored: {}
      });
    });
    test("forever", () => {
      const env = buildTestingEnvironment();
      env.currentTime = FAKE_CURRENT_TIME;
      expect(addMute(env, createEmptyConfig(), PR, "forever")).toEqual({
        mutedPullRequests: [
          {
            ...PR,
            until: {
              kind: "forever"
            }
          }
        ],
        ignored: {}
      });
    });
    test("repo", () => {
      const env = buildTestingEnvironment();
      env.currentTime = FAKE_CURRENT_TIME;
      expect(addMute(env, createEmptyConfig(), PR, "repo")).toEqual({
        mutedPullRequests: [],
        ignored: {
          zenclabs: {
            kind: "ignore-only",
            repoNames: ["prmonitor"]
          }
        }
      });
    });
    test("owner", () => {
      const env = buildTestingEnvironment();
      env.currentTime = FAKE_CURRENT_TIME;
      expect(addMute(env, createEmptyConfig(), PR, "owner")).toEqual({
        mutedPullRequests: [],
        ignored: {
          zenclabs: {
            kind: "ignore-all"
          }
        }
      });
    });
    it("does not duplicate", () => {
      const env = buildTestingEnvironment();
      env.currentTime = 1;

      let muteConfiguration = createEmptyConfig();

      // Mute for an hour.
      muteConfiguration = addMute(env, muteConfiguration, PR, "1-hour");
      expect(muteConfiguration).toEqual({
        mutedPullRequests: [
          {
            ...PR,
            until: {
              kind: "specific-time",
              unmuteAtTimestamp: 3600001
            }
          }
        ],
        ignored: {}
      });

      // One hour is elapsed.
      env.currentTime = 4000000;

      // Mute until next update.
      muteConfiguration = addMute(env, muteConfiguration, PR, "next-update");

      // Ensure there is only one mute for this pull request.
      expect(muteConfiguration).toEqual({
        mutedPullRequests: [
          {
            ...PR,
            until: {
              kind: "next-update",
              mutedAtTimestamp: 4000000
            }
          }
        ],
        ignored: {}
      });
    });
  });

  describe("removePullRequestMute", () => {
    it("removes matching mutes", () => {
      expect(
        removePullRequestMute(
          {
            mutedPullRequests: [
              {
                ...PR,
                until: {
                  kind: "next-update",
                  mutedAtTimestamp: 1
                }
              },
              {
                ...OTHER_PR_SAME_REPO,
                until: {
                  kind: "forever"
                }
              },
              {
                ...OTHER_PR_DIFFERENT_REPO,
                until: {
                  kind: "forever"
                }
              },
              {
                ...PR,
                until: {
                  kind: "forever"
                }
              },
              {
                ...OTHER_PR_DIFFERENT_OWNER,
                until: {
                  kind: "forever"
                }
              }
            ],
            ignored: {}
          },
          PR
        )
      ).toEqual({
        mutedPullRequests: [
          {
            ...OTHER_PR_SAME_REPO,
            until: {
              kind: "forever"
            }
          },
          {
            ...OTHER_PR_DIFFERENT_REPO,
            until: {
              kind: "forever"
            }
          },
          {
            ...OTHER_PR_DIFFERENT_OWNER,
            until: {
              kind: "forever"
            }
          }
        ],
        ignored: {}
      });
    });
    it("does not fail when empty", () => {
      expect(removePullRequestMute(createEmptyConfig(), PR)).toEqual({
        mutedPullRequests: [],
        ignored: {}
      });
    });
  });

  describe("removeOwnerMute", () => {
    it("removes when ignore-all", () => {
      expect(
        removeOwnerMute(
          {
            mutedPullRequests: [],
            ignored: {
              zenclabs: {
                kind: "ignore-all"
              },
              fwouts: {
                kind: "ignore-only",
                repoNames: ["codetree"]
              }
            }
          },
          "zenclabs"
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {
          fwouts: {
            kind: "ignore-only",
            repoNames: ["codetree"]
          }
        }
      });
    });
    it("removes when ignore-only", () => {
      expect(
        removeOwnerMute(
          {
            mutedPullRequests: [],
            ignored: {
              zenclabs: {
                kind: "ignore-only",
                repoNames: ["prmonitor"]
              },
              fwouts: {
                kind: "ignore-only",
                repoNames: ["codetree"]
              }
            }
          },
          "zenclabs"
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {
          fwouts: {
            kind: "ignore-only",
            repoNames: ["codetree"]
          }
        }
      });
    });
    it("does not fail when empty", () => {
      expect(
        removeOwnerMute(
          {
            mutedPullRequests: []
          },
          "zenclabs"
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {}
      });
    });
  });

  describe("removeRepositoryMute", () => {
    it("removes only repository when there are more ignored repositories", () => {
      expect(
        removeRepositoryMute(
          {
            mutedPullRequests: [],
            ignored: {
              zenclabs: {
                kind: "ignore-only",
                repoNames: ["spot", "prmonitor"]
              },
              fwouts: {
                kind: "ignore-only",
                repoNames: ["codetree"]
              }
            }
          },
          REPO
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {
          zenclabs: {
            kind: "ignore-only",
            repoNames: ["spot"]
          },
          fwouts: {
            kind: "ignore-only",
            repoNames: ["codetree"]
          }
        }
      });
    });
    it("removes ignore configuration when no more ignored repositories", () => {
      expect(
        removeRepositoryMute(
          {
            mutedPullRequests: [],
            ignored: {
              fwouts: {
                kind: "ignore-only",
                repoNames: ["codetree"]
              }
            }
          },
          REPO
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {
          fwouts: {
            kind: "ignore-only",
            repoNames: ["codetree"]
          }
        }
      });
    });
    it("defaults to removing when ignore-all", () => {
      expect(
        removeRepositoryMute(
          {
            mutedPullRequests: [],
            ignored: {
              zenclabs: {
                kind: "ignore-all"
              },
              fwouts: {
                kind: "ignore-only",
                repoNames: ["codetree"]
              }
            }
          },
          REPO
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {
          fwouts: {
            kind: "ignore-only",
            repoNames: ["codetree"]
          }
        }
      });
    });
    it("does not fail when empty", () => {
      expect(
        removeRepositoryMute(
          {
            mutedPullRequests: []
          },
          REPO
        )
      ).toEqual({
        mutedPullRequests: [],
        ignored: {}
      });
    });
  });
});

function createEmptyConfig(): MuteConfiguration {
  return {
    mutedPullRequests: []
  };
}
