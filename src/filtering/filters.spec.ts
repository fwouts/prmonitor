import { buildTestingEnvironment } from "../environment/testing/fake";
import {
  MuteConfiguration,
  NOTHING_MUTED,
} from "../storage/mute-configuration";
import { fakePullRequest } from "../testing/fake-pr";
import { Filter } from "./filters";
import { getFilteredBucket } from "./testing";

const DIRECT_REQUEST_UNMUTED: MuteConfiguration = {
  ...NOTHING_MUTED,

  onlyDirectRequests: true,
  whitelistedTeams: ["whitelisted-team"],
};

describe("filters (incoming)", () => {
  it("is MINE for the user's own PRs", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "fwouts",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("fwouts")
          .reviewRequested(["kevin", "fwouts"])
          .build()
      )
    ).toEqual([Filter.MINE]);
  });
  it("is NOTHING when the user is not a reviewer and hasn't commented", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested([])
          .build()
      )
    ).toEqual([]);
  });
  it("is INCOMING when the user is a reviewer and hasn't reviewed or commented", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is in a reviewer team and hasn't reviewed or commented", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .teams({
            team: ["kevin"],
          })
          .reviewRequested([], ["team"])
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is NOTHING when the user is in a reviewer team, but only wants whitelisted teams", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        DIRECT_REQUEST_UNMUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .teams({
            team: ["kevin"],
          })
          .reviewRequested([], ["team"])
          .build()
      )
    ).toEqual([]);
  });
  it("is INCOMING when the user is in a reviewer team, but only wants whitelisted teams", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        DIRECT_REQUEST_UNMUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .teams({
            team: ["kevin"],
            "whitelisted-team": ["kevin"],
          })
          .reviewRequested([], ["whitelisted-team"])
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is not a reviewer but had reviewed, and the author responds", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addReview("kevin", "COMMENTED")
          .addComment("fwouts")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the user is not a reviewer but had commented, and the author responds", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .addComment("fwouts")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is REVIEWED when the user has reviewed and the author hasn't responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .build()
      )
    ).toEqual([Filter.REVIEWED]);
  });
  it("is REVIEWED when the user is a reviewer, has commented and the author hasn't responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .addComment("kevin")
          // Another user posted a review.
          .addReview("dries", "CHANGES_REQUESTED")
          .build()
      )
    ).toEqual([Filter.REVIEWED]);
  });
  it("is INCOMING when the author responded with a comment", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .addComment("fwouts")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the author responded with a review", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .addReview("fwouts", "COMMENTED")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was previously reviewed but the author responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was approved but the author responded", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addReview("kevin", "APPROVED")
          .addComment("fwouts")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is still INCOMING when there are pending review comments", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .addReview("kevin", "PENDING")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is still INCOMING when there are pending review comments, and reviewer in reviewer team", () => {
    const env = buildTestingEnvironment();
    expect(
      getFilteredBucket(
        env,
        "kevin",
        NOTHING_MUTED,
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .teams({
            team: ["kevin"],
          })
          .reviewRequested([], ["team"])
          .addReview("kevin", "PENDING")
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is MUTED when the PR is muted until next update and the author did not add new comments or reviews", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          // Another user posted a review after we muted.
          .addReview("dries", "CHANGES_REQUESTED", 200)
          .build()
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is MUTED when the PR is muted until next update and the author did not add new comments or reviews", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          // Another user posted a review after we muted.
          .addReview("dries", "CHANGES_REQUESTED", 200)
          .build()
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is MUTED when the PR is muted until next comment and the author added commits but did not add new comments or reviews", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-comment-by-author",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .teams({
            team: ["kevin"],
          })
          .reviewRequested([], ["team"])
          .addCommit(300)
          .build()
      )
    ).toEqual([Filter.MUTED]);
  });
  it("is MUTED when the PR is muted until not draft and the PR is still a draft", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "not-draft",
              },
            },
          ],
        },
        fakePullRequest()
          .draft()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "specific-time",
                unmuteAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .build()
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "forever",
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "forever",
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .addComment("kevin")
          .build()
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
              kind: "ignore-all",
            },
          },
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
              repoNames: ["prmonitor"],
            },
          },
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
      )
    ).toEqual([Filter.IGNORED]);
  });
  it("is INCOMING when the PR was muted until next update but the author added comments since muting", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .addComment("fwouts", 200)
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was muted until next update but the author added commits since muting", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .addCommit(200)
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was muted until next comment but the author added comments since muting", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "next-comment-by-author",
                mutedAtTimestamp: 100,
              },
            },
          ],
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .addComment("fwouts", 200)
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
  it("is INCOMING when the PR was muted until not draft and the PR is no longer a draft", () => {
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
                name: "prmonitor",
              },
              number: 1,
              until: {
                kind: "not-draft",
              },
            },
          ],
        },
        fakePullRequest()
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
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
                name: "other",
              },
              number: 1,
              until: {
                kind: "next-update",
                mutedAtTimestamp: new Date("2019-03-16T17:00:11Z").getTime(),
              },
            },
          ],
        },
        fakePullRequest()
          .ref("zenclabs", "prmonitor", 1)
          .author("fwouts")
          .seenAs("kevin")
          .reviewRequested(["kevin"])
          .build()
      )
    ).toEqual([Filter.INCOMING]);
  });
});
