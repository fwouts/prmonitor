import { PullRequest } from "../../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute";
import { isReviewNeeded } from "./review-needed";

const DUMMY_PR: PullRequest = {
  authorLogin: "fwouts",
  repoOwner: "zenclabs",
  repoName: "prmonitor",
  pullRequestNumber: 1,
  title: "Dummy PR",
  htmlUrl: "https://github.com/zenclabs/prmonitor/pull/1",
  nodeId: "fake",
  requestedReviewers: [],
  reviews: [],
  updatedAt: "2019-03-15T17:00:11Z"
};

const NO_MUTING: MuteConfiguration = {
  mutedPullRequests: []
};

describe("isReviewNeeded", () => {
  it("is false for the user's own PRs", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["fwouts"]
        },
        "fwouts",
        NO_MUTING
      )
    ).toBe(false);
  });
  it("is false when the user is not a reviewer and hasn't commented", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: []
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(false);
  });
  it("is true when the user is a reviewer and hasn't reviewed or commented", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"]
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the user is not a reviewer but had reviewed, and new changes are made", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          reviews: [
            {
              authorLogin: "kevin",
              state: "COMMENTED",
              submittedAt: "2019-02-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the user is not a reviewer but had commented, and new changes are made", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          comments: [
            {
              authorLogin: "kevin",
              createdAt: "2019-02-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is false when the user has reviewed after the last changes", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          reviews: [
            {
              authorLogin: "kevin",
              state: "COMMENTED",
              submittedAt: "2019-04-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(false);
  });
  it("is false when the user has commented after the last changes", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          comments: [
            {
              authorLogin: "kevin",
              createdAt: "2019-04-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(false);
  });
  it("is true when the PR was not updated but a review was explicitly requested from the user", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"],
          comments: [
            {
              authorLogin: "kevin",
              createdAt: "2019-04-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the author wrote a new comment without updating the PR", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
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
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the author wrote a new review without updating the PR", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
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
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the PR was reviewed but has been updated", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          reviews: [
            {
              authorLogin: "kevin",
              state: "CHANGES_REQUESTED",
              submittedAt: "2019-02-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("is true when the PR was approved and has been updated", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          reviews: [
            {
              authorLogin: "kevin",
              state: "APPROVED",
              submittedAt: "2019-02-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("ignores pending review comments", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: [],
          reviews: [
            {
              authorLogin: "kevin",
              state: "PENDING",
              submittedAt: "2019-04-15T17:00:11Z"
            }
          ],
          updatedAt: "2019-03-15T17:00:11Z"
        },
        "kevin",
        NO_MUTING
      )
    ).toBe(true);
  });
  it("ignores muted PRs that have not been updated since muting", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"],
          updatedAt: "2019-03-15T17:00:11Z",
          reviews: [
            // Another user posted a review after we muted.
            {
              authorLogin: "dries",
              state: "CHANGES_REQUESTED",
              submittedAt: "2019-03-18T17:00:11Z"
            }
          ]
        },
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
        }
      )
    ).toBe(false);
  });
  it("does not mute PRs that have been updated since muting", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"],
          updatedAt: "2019-03-20T17:00:11Z"
        },
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
        }
      )
    ).toBe(true);
  });
  it("does not mute PRs that have been commented on by author since muting", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"],
          updatedAt: "2019-03-15T17:00:11Z",
          comments: [
            {
              authorLogin: "fwouts",
              createdAt: "2019-03-18T17:00:11Z"
            }
          ]
        },
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
        }
      )
    ).toBe(true);
  });
  it("does not mute unrelated PRs", () => {
    expect(
      isReviewNeeded(
        {
          ...DUMMY_PR,
          authorLogin: "fwouts",
          requestedReviewers: ["kevin"]
        },
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
        }
      )
    ).toBe(true);
  });
});
