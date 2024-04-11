import { observer } from "mobx-react-lite";
import React from "react";
import { Badge } from "react-bootstrap";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { PullRequestState } from "../filtering/status";
import { CheckStatus } from "../github-api/api";

const UNREVIEWED = (
  <Badge pill bg="danger" key="unreviewed">
    Unreviewed
  </Badge>
);

const AUTHOR_REPLIED = (
  <Badge pill bg="secondary" key="author-replied">
    Author replied
  </Badge>
);

const DRAFT = (
  <Badge pill bg="dark" key="draft">
    Draft
  </Badge>
);

const MERGED = (
  <Badge pill bg="" style={{ backgroundColor: "#8259DD" }} key="merged">
    Merged
  </Badge>
);

const APPROVED = (
  <Badge pill bg="success" key="approved">
    Approved
  </Badge>
);

const CHECK_STATUS_PASSED = (
  <Badge pill bg="success" key="check-status-passed">
    Tests
  </Badge>
);
const CHECK_STATUS_FAILED = (
  <Badge pill bg="danger" key="check-status-failed">
    Tests
  </Badge>
);
const CHECK_STATUS_PENDING = (
  <Badge pill bg="warning" key="check-status-pending">
    Tests
  </Badge>
);

const CHANGES_REQUESTED = (
  <Badge pill bg="danger" key="changes-requested">
    Changes requested
  </Badge>
);

const NEEDS_REVIEW = (
  <Badge pill bg="info" key="waiting-for-review">
    Needs review
  </Badge>
);

export const PullRequestStatus = observer(
  ({ pullRequest }: { pullRequest: EnrichedPullRequest }) => {
    const badges = getBadges(pullRequest.state);
    if (badges.length > 0) {
      return (
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            justifyContent: "flex-end",
            maxWidth: "40%",
          }}
        >
          {badges}
        </div>
      );
    }
    return <></>;
  }
);

function getBadges(state: PullRequestState): JSX.Element[] {
  switch (state.kind) {
    case "incoming":
      return getIncomingStateBadges(state);
    case "outgoing":
      return getOutgoingStateBadges(state);
  }
  return [];
}

function getCheckStatusBadge(checkStatus?: CheckStatus): JSX.Element[] {
  switch (checkStatus) {
    case "PENDING":
      return [CHECK_STATUS_PENDING];
    case "SUCCESS":
      return [CHECK_STATUS_PASSED];
    case "FAILURE":
      return [CHECK_STATUS_FAILED];
    case "ERROR":
    case "EXPECTED":
    default:
      return [];
  }
}

function getIncomingStateBadges(state: PullRequestState): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (state.draft) {
    badges.push(DRAFT);
  } else if (state.newReviewRequested) {
    badges.push(UNREVIEWED);
  } else if (state.changesRequested) {
    badges.push(CHANGES_REQUESTED);
  }

  if (state.authorResponded) {
    badges.push(AUTHOR_REPLIED);
  }

  badges.push(...getCheckStatusBadge(state.checkStatus));

  return badges;
}

function getOutgoingStateBadges(state: PullRequestState): JSX.Element[] {
  const badges: JSX.Element[] = [];

  if (state.isMerged) {
    badges.push(MERGED);
    return badges;
  } else if (state.draft) {
    badges.push(DRAFT);
  } else if (state.approved) {
    badges.push(APPROVED);
  } else if (state.changesRequested) {
    badges.push(CHANGES_REQUESTED);
  } else {
    badges.push(NEEDS_REVIEW);
  }

  badges.push(...getCheckStatusBadge(state.checkStatus));

  return badges;
}
