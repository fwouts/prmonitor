import { PullRequest } from "../storage/loaded-state";
import { NOTHING_MUTED } from "../storage/mute-configuration";
import { Filter, filterPredicate } from "./filters";

const DUMMY_PR: PullRequest = {
  authorLogin: "fwouts",
  repoOwner: "zenclabs",
  repoName: "prmonitor",
  pullRequestNumber: 1,
  title: "Dummy PR",
  htmlUrl: "https://github.com/zenclabs/prmonitor/pull/1",
  nodeId: "fake",
  requestedReviewers: [],
  reviews: []
};

describe("filters (muted)", () => {
  it("is false for the user's own PRs", () => {
    expect(
      filterPredicate("fwouts", NOTHING_MUTED, Filter.MUTED)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: ["fwouts"]
      })
    ).toBe(false);
  });
  it("is false when the user is not a reviewer and hasn't commented", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.MUTED)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: []
      })
    ).toBe(false);
  });
  it("is false when the user is a reviewer, hasn't reviewed or commented and has not muted the PR", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.MUTED)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: ["kevin"]
      })
    ).toBe(false);
  });
  it("is true when the user is a reviewer, hasn't reviewed or commented and has muted the PR", () => {
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
        Filter.INCOMING
      )({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: ["kevin"]
      })
    ).toBe(false);
  });
  it("is false when the PR is muted but no longer needs to be reviewed", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.MUTED)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: [],
        reviews: [
          {
            authorLogin: "kevin",
            state: "COMMENTED",
            submittedAt: "2019-02-15T17:00:11Z"
          }
        ]
      })
    ).toBe(false);
  });
});
