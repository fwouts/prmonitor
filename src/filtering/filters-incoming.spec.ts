import { PullRequest } from "../storage/loaded-state";
import { NOTHING_MUTED } from "../storage/mute-configuration";
import { Filter, filterPredicate } from "./filters";

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
  requestedReviewers: [],
  reviews: [],
  comments: []
};

describe("filters (incoming)", () => {
  it("is false for the user's own PRs", () => {
    expect(
      filterPredicate("fwouts", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: ["fwouts"]
      })
    ).toBe(false);
  });
  it("is false when the user is not a reviewer and hasn't commented", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: []
      })
    ).toBe(false);
  });
  it("is true when the user is a reviewer and hasn't reviewed or commented", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"]
      })
    ).toBe(true);
  });
  it("is true when the user is not a reviewer but had reviewed, and the author responds", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("is true when the user is not a reviewer but had commented, and the author responds", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("is false when the user has reviewed and the author hasn't responded", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-04-15T17:00:11Z"
          }
        ]
      })
    ).toBe(false);
  });
  it("is false when the user is a reviewer, has commented and the author hasn't responded", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"],
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
    ).toBe(false);
  });
  it("is true when the author responded with a comment", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("is true when the author responded with a review", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("is true when the PR was previously reviewed but the author responded", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("is true when the PR was approved but the author responded", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: [],
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
    ).toBe(true);
  });
  it("ignores pending review comments", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.INCOMING)({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"],
        reviews: [
          {
            authorLogin: "kevin",
            state: "PENDING",
            submittedAt: "2019-04-15T17:00:11Z"
          }
        ]
      })
    ).toBe(true);
  });
  it("ignores muted PRs that the author did not add new comments or reviews to", () => {
    expect(
      filterPredicate(
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
        Filter.INCOMING
      )({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"],
        reviews: [
          // Another user posted a review after we muted.
          {
            authorLogin: "dries",
            state: "CHANGES_REQUESTED",
            submittedAt: "2019-03-18T17:00:11Z"
          }
        ]
      })
    ).toBe(false);
  });
  it("does not ignore muted PRs that the author added comments to since muting", () => {
    expect(
      filterPredicate(
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
        Filter.INCOMING
      )({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"],
        comments: [
          {
            authorLogin: "fwouts",
            createdAt: "2019-03-18T17:00:11Z"
          }
        ]
      })
    ).toBe(true);
  });
  it("is true for a PR that needs review when an unrelated PR is muted", () => {
    expect(
      filterPredicate(
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
        Filter.INCOMING
      )({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"]
      })
    ).toBe(true);
  });
});
