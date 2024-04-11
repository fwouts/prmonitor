import { fakePullRequest } from "../testing/fake-pr";
import { pullRequestState } from "./status";

describe("pullRequestState", () => {
  test("incoming", () => {
    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .reviewRequested(["fwouts"])
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: true,
      newCommit: false,
      authorResponded: false,
      directlyAdded: true,
      teams: [],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .teams({
            team: ["fwouts"],
            "out-team": ["dries"],
          })
          .reviewRequested([], ["team"])
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: true,
      newCommit: false,
      authorResponded: false,
      directlyAdded: false,
      teams: ["team"],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .addComment("fwouts")
          .addComment("kevin")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: false,
      newCommit: false,
      authorResponded: true,
      directlyAdded: false,
      teams: [],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .addComment("fwouts")
          .addCommit()
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: false,
      newCommit: true,
      authorResponded: false,
      directlyAdded: false,
      teams: [],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .addComment("fwouts")
          .addCommit()
          .addComment("kevin")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: false,
      newCommit: true,
      authorResponded: true,
      directlyAdded: false,
      teams: [],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .addComment("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: false,
      newCommit: false,
      authorResponded: false,
      directlyAdded: false,
      teams: [],
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .addReview("fwouts", "CHANGES_REQUESTED")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "incoming",
      draft: false,
      newReviewRequested: false,
      newCommit: false,
      authorResponded: false,
      directlyAdded: false,
      teams: [],
    });
  });

  test("not involved", () => {
    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .reviewRequested(["dries"])
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "not-involved",
      draft: false,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("kevin")
          .seenAs("fwouts")
          .teams({
            team: ["fwouts"],
            "out-team": ["dries"],
          })
          .reviewRequested([], ["out-team"])
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "not-involved",
      draft: false,
    });
  });

  test("outgoing", () => {
    expect(
      pullRequestState(
        fakePullRequest().author("fwouts").seenAs("fwouts").build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: true,
      changesRequested: false,
      approved: false,
    });

    expect(
      pullRequestState(
        fakePullRequest().author("fwouts").draft().seenAs("fwouts").build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: true,
      noReviewers: true,
      changesRequested: false,
      approved: false,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin"])
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      approved: false,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin", "dries"])
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .addReview("kevin", "APPROVED")
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      approved: false,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin", "dries"])
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .addReview("kevin", "APPROVED")
          .addReview("dries", "APPROVED")
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      approved: true,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin"])
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .addReview("kevin", "APPROVED")
          .addComment("dries")
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      approved: false,
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin"])
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .addReview("kevin", "APPROVED")
          .addReview("dries", "COMMENTED")
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      approved: false,
    });
  });
});
