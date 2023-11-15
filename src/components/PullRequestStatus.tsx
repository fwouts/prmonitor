import { observer } from "mobx-react-lite";
import React from "react";
import { Badge } from "react-bootstrap";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import {
  IncomingState,
  OutgoingState,
  PullRequestState,
} from "../filtering/status";
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

const MERGEABLE = (
  <Badge pill bg="success" key="mergeable">
    Mergeable
  </Badge>
);

const NOT_MERGEABLE = (
  <Badge pill bg="danger" key="not_mergeable">
    Mergeable
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

const NO_REVIEWER_ASSIGNED = (
  <Badge pill bg="light" key="no-reviewer-assigned">
    No reviewer assigned
  </Badge>
);

export const PullRequestStatus = observer(
  ({ pullRequest }: { pullRequest: EnrichedPullRequest }) => {
    const badges = getBadges(pullRequest.state);
    if (badges.length > 0) {
      return (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {badges}
        </div>
      );
    }
    return <></>;
  }
);

function getBadges(state: PullRequestState): JSX.Element[] {
  const badges: JSX.Element[] = [];
  switch (state.kind) {
    case "incoming":
      badges.push(...getIncomingStateBadges(state));
      break;
    case "outgoing":
      badges.push(...getOutgoingStateBadges(state));
      break;
    default:
    // Do nothing.
  }
  return badges;
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

function getIncomingStateBadges(state: IncomingState): JSX.Element[] {
  const badges: JSX.Element[] = [];
  badges.push(...getCheckStatusBadge(state.checkStatus));
  if (state.draft) {
    badges.push(DRAFT);
  }
  if (state.newReviewRequested) {
    badges.push(UNREVIEWED);
    return badges;
  }
  if (state.changesRequested) {
    badges.push(CHANGES_REQUESTED);
  }
  if (state.authorResponded) {
    badges.push(AUTHOR_REPLIED);
  }
  return badges;
}

function getOutgoingStateBadges(state: OutgoingState): JSX.Element[] {
  const badges: JSX.Element[] = [];
  badges.push(...getCheckStatusBadge(state.checkStatus));
  badges.push(state.mergeable ? MERGEABLE : NOT_MERGEABLE);

  if (state.draft) {
    badges.push(DRAFT);
  } else if (state.approved) {
    badges.push(APPROVED);
  } else if (state.changesRequested) {
    badges.push(CHANGES_REQUESTED);
  } else {
    badges.push(NEEDS_REVIEW);
    if (state.noReviewers) {
      badges.push(NO_REVIEWER_ASSIGNED);
    }
  }

  return badges;
}
