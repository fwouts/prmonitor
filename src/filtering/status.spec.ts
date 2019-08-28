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
      newReviewRequested: true,
      newCommit: false,
      authorResponded: false
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
      newReviewRequested: false,
      newCommit: false,
      authorResponded: true
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
      newReviewRequested: false,
      newCommit: true,
      authorResponded: false
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
      newReviewRequested: false,
      newCommit: true,
      authorResponded: true
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
      newReviewRequested: false,
      newCommit: false,
      authorResponded: false
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
      newReviewRequested: false,
      newCommit: false,
      authorResponded: false
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
      kind: "not-involved"
    });
  });

  test("outgoing", () => {
    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: true,
      changesRequested: false,
      mergeable: false,
      approvedByEveryone: false
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .draft()
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: true,
      noReviewers: true,
      changesRequested: false,
      mergeable: false,
      approvedByEveryone: false
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
      mergeable: false,
      approvedByEveryone: false
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
          .reviewRequested(["kevin", "dries"])
          .addReview("kevin", "CHANGES_REQUESTED")
          .addComment("fwouts")
          .addReview("kevin", "APPROVED")
          .mergeable()
          .seenAs("fwouts")
          .build(),
        "fwouts"
      )
    ).toEqual({
      kind: "outgoing",
      draft: false,
      noReviewers: false,
      changesRequested: false,
      mergeable: true,
      approvedByEveryone: false
    });

    expect(
      pullRequestState(
        fakePullRequest()
          .author("fwouts")
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
      mergeable: false,
      approvedByEveryone: true
    });
  });
});
