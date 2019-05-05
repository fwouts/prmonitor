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

describe("filters (reviewed)", () => {
  it("is false for the user's own PRs", () => {
    expect(
      filterPredicate("fwouts", NOTHING_MUTED, Filter.REVIEWED)({
        ...DUMMY_PR,
        requestedReviewers: ["fwouts"]
      })
    ).toBe(false);
  });
  it("is false when the user is not a reviewer and hasn't commented", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.REVIEWED)({
        ...DUMMY_PR,
        requestedReviewers: []
      })
    ).toBe(false);
  });
  it("is false when the user needs to review the PR", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.REVIEWED)({
        ...DUMMY_PR,
        requestedReviewers: ["kevin"]
      })
    ).toBe(false);
  });
  it("is true when the user is a reviewer and has already reviewed", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.REVIEWED)({
        ...DUMMY_PR,
        requestedReviewers: [],
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ]
      })
    ).toBe(true);
  });
  it("is true when the user is a reviewer and has already reviewed, even if the PR is muted", () => {
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
                mutedAtTimestamp: 1000
              }
            }
          ]
        },
        Filter.REVIEWED
      )({
        ...DUMMY_PR,
        requestedReviewers: [],
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ]
      })
    ).toBe(true);
  });
});
