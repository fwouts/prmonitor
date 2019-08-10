import { buildTestingEnvironment } from "../environment/testing/fake";
import { PullRequest } from "../storage/loaded-state";
import { NOTHING_MUTED } from "../storage/mute-configuration";
import { Filter } from "./filters";
import { getFilteredBucket } from "./testing";

const DUMMY_PR: PullRequest = {
  author: {
    login: "fwouts",
    avatarUrl: "http://url"
  },
  repoOwner: "zenclabs",
  repoName: "prmonitor",
  pullRequestNumber: 1,
  title: "Dummy PR",
  updatedAt: "5 May 2019",
  htmlUrl: "https://github.com/zenclabs/prmonitor/pull/1",
  nodeId: "fake",
  reviewRequested: false,
  reviews: [],
  comments: []
};

describe("filters (incoming)", () => {
  it("is MINE for the user's own PRs", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "fwouts", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true
      })
    ).toEqual([Filter.MINE]);
  });
  it("is NOTHING when the user is not a reviewer and hasn't commented", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false
      })
    ).toEqual([]);
  });
  it("is INCOMING when the user is a reviewer and hasn't reviewed or commented", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is not a reviewer but had reviewed, and the author responds", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ],
        comments: [
          {
            authorLogin: "fwouts",
            createdAt: "2019-02-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is not a reviewer but had commented, and the author responds", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        comments: [
          {
            authorLogin: "kevin",
            createdAt: "2019-02-15T17:00:11Z"
          },
          {
            authorLogin: "fwouts",
            createdAt: "2019-02-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is REVIEWED when the user has reviewed and the author hasn't responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-04-15T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.REVIEWED]);
  });
  it("is REVIEWED when the user is a reviewer, has commented and the author hasn't responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true,
        comments: [
          {
            authorLogin: "kevin",
            createdAt: "2019-04-15T17:00:11Z"
          }
        ],
        // Another user posted a review after we muted.
        reviews: [
          {
            authorLogin: "dries",
            state: "CHANGES_REQUESTED",
            submittedAt: "2019-03-18T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.REVIEWED]);
  });
  it("is INCOMING when the author responded with a comment", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        comments: [
          {
            authorLogin: "kevin",
            createdAt: "2019-04-15T17:00:11Z"
          },
          {
            authorLogin: "fwouts",
            createdAt: "2019-04-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the author responded with a review", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        comments: [
          {
            authorLogin: "kevin",
            createdAt: "2019-04-15T17:00:11Z"
          }
        ],
        reviews: [
          {
            authorLogin: "fwouts",
            state: "COMMENTED",
            submittedAt: "2019-04-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was previously reviewed but the author responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        reviews: [
          {
            authorLogin: "kevin",
            state: "CHANGES_REQUESTED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ],
        comments: [
          {
            authorLogin: "fwouts",
            createdAt: "2019-02-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was approved but the author responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false,
        reviews: [
          {
            authorLogin: "kevin",
            state: "APPROVED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ],
        comments: [
          {
            authorLogin: "fwouts",
            createdAt: "2019-02-16T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is still INCOMING when there are pending review comments", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(env, "kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true,
        reviews: [
          {
            authorLogin: "kevin",
            state: "PENDING",
            submittedAt: "2019-04-15T17:00:11Z"
          }
        ]
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is MUTED when the PR is muted until next update and the author did not add new comments or reviews to", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: new Date("2019-03-16T17:00:11Z").getTime()
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true,
          reviews: [
            // Another user posted a review after we muted.
            {
              authorLogin: "dries",
              state: "CHANGES_REQUESTED",
              submittedAt: "2019-03-18T17:00:11Z"
            }
          ]
        }
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is MUTED when the PR is muted until a specific time that hasn't been reached yet", () => {
    const env = buildTestingEnvironment();
    env.currentTime = 50;
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is INCOMING when the PR is muted until a specific time that has been reached and the PR needs review", () => {
    const env = buildTestingEnvironment();
    env.currentTime = 150;
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is REVIEWED when the PR is muted until a specific time that has been reached but the PR has been reviewed", () => {
    const env = buildTestingEnvironment();
    env.currentTime = 150;
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true,
          comments: [
            {
              authorLogin: "kevin",
              createdAt: new Date(100).toISOString()
            }
          ]
        }
      )
    ).toEqual([Filter.REVIEWED]);
  });
  it("is MUTED when the PR is muted forever and the PR needs review", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "forever"
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is REVIEWED when the PR is muted forever and the PR has been reviewed", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "forever"
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true,
          comments: [
            {
              authorLogin: "kevin",
              createdAt: new Date(100).toISOString()
            }
          ]
        }
      )
    ).toEqual([Filter.REVIEWED]);
  });
  it("is IGNORED when the PR belongs to an owner that is ignored", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [],
          ignored: {
            zenclabs: {
              kind: "ignore-all"
            }
          }
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.IGNORED]);
  });
  it("is IGNORED when the PR belongs to a repository that is ignored", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [],
          ignored: {
            zenclabs: {
              kind: "ignore-only",
              repoNames: ["prmonitor"]
            }
          }
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.IGNORED]);
  });
  it("is INCOMING when the PR was muted but the author added comments since muting", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "zenclabs",
                name: "prmonitor"
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: new Date("2019-03-16T17:00:11Z").getTime()
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true,
          comments: [
            {
              authorLogin: "fwouts",
              createdAt: "2019-03-18T17:00:11Z"
            }
          ]
        }
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING for a PR that needs review when an unrelated PR is muted", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        {
          mutedPullRequests: [
            {
              repo: {
                owner: "other",
                name: "other"
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: new Date("2019-03-16T17:00:11Z").getTime()
              }
            }
          ]
        },
        {
          ...DUMMY_PR,
          reviewRequested: true
        }
      )
    ).toEqual([Filter.INCOMING]);
  });
});
