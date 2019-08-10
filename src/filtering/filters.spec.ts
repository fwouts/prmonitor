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
    expect(
      getFilteredBucket("fwouts", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true
      })
    ).toEqual([Filter.MINE]);
  });
  it("is NOTHING when the user is not a reviewer and hasn't commented", () => {
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: false
      })
    ).toEqual([]);
  });
  it("is INCOMING when the user is a reviewer and hasn't reviewed or commented", () => {
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
        ...DUMMY_PR,
        reviewRequested: true
      })
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is not a reviewer but had reviewed, and the author responds", () => {
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
    expect(
      getFilteredBucket("kevin", NOTHING_MUTED, {
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
  it("is MUTED when the PR is muted until next upadte and the author did not add new comments or reviews to", () => {
    expect(
      getFilteredBucket(
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
  it.todo(
    "is MUTED when the PR is muted until a specific time that hasn't been reached yet"
  );
  it.todo(
    "is INCOMING when the PR is muted until a specific time that has been reached and the PR needs review"
  );
  it.todo(
    "is REVIEWED when the PR is muted until a specific time that has been reached but the PR has been reviewed"
  );
  it.todo("is MUTED when the PR is muted forever and the PR needs review");
  it.todo(
    "is REVIEWED when the PR is muted forever and the PR has been reviewed"
  );
  it.todo("is IGNORED when the PR belongs to an owner that is ignored");
  it.todo("is IGNORED when the PR belongs to a repository that is ignored");
  it("is INCOMING when the PR was muted but the author added comments since muting", () => {
    expect(
      getFilteredBucket(
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
    expect(
      getFilteredBucket(
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
