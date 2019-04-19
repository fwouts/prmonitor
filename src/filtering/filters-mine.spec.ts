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

describe("filters (reviewed)", () => {
  it("is true for the user's own PRs", () => {
    expect(
      filterPredicate("fwouts", NOTHING_MUTED, Filter.MINE)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: ["fwouts"]
      })
    ).toBe(true);
  });
  it("is false for other PRs", () => {
    expect(
      filterPredicate("kevin", NOTHING_MUTED, Filter.MINE)({
        ...DUMMY_PR,
        authorLogin: "fwouts",
        requestedReviewers: ["fwouts"]
      })
    ).toBe(false);
  });
});
