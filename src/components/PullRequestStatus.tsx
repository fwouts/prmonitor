import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { Badge } from "react-bootstrap";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import {
  IncomingState,
  OutgoingState,
  PullRequestState,
} from "../filtering/status";

const StateBox = styled.div`
  padding: 0 8px;
`;

const SpacedBadge = styled(Badge)`
  margin-right: 4px;
`;

const UNREVIEWED = (
  <SpacedBadge pill variant="danger" key="unreviewed">
    Unreviewed
  </SpacedBadge>
);

const AUTHOR_REPLIED = (
  <SpacedBadge pill variant="secondary" key="author-replied">
    Author replied
  </SpacedBadge>
);

const NEW_COMMIT = (
  <SpacedBadge pill variant="primary" key="new-commit">
    New commit
  </SpacedBadge>
);

const DRAFT = (
  <SpacedBadge pill variant="dark" key="draft">
    Draft
  </SpacedBadge>
);

const MERGEABLE = (
  <SpacedBadge pill variant="success" key="mergeable">
    Mergeable
  </SpacedBadge>
);

const APPROVED_BY_EVERONE = (
  <SpacedBadge pill variant="success" key="approved-by-everyone">
    Approved by everyone
  </SpacedBadge>
);

const CHECK_STATUS_PASSED = (
  <SpacedBadge pill variant="success" key="check-status-passed">
    Checks Pass
  </SpacedBadge>
);
const CHECK_STATUS_FAILED = (
  <SpacedBadge pill variant="danger" key="check-status-passed">
    Checks Fail
  </SpacedBadge>
);

const CHANGES_REQUESTED = (
  <SpacedBadge pill variant="warning" key="changes-requested">
    Changes requested
  </SpacedBadge>
);

const WAITING_FOR_REVIEW = (
  <SpacedBadge pill variant="info" key="waiting-for-review">
    Waiting for review
  </SpacedBadge>
);

const NO_REVIEWER_ASSIGNED = (
  <SpacedBadge pill variant="light" key="no-reviewer-assigned">
    No reviewer assigned
  </SpacedBadge>
);

export const PullRequestStatus = observer(
  ({ pullRequest }: { pullRequest: EnrichedPullRequest }) => {
    const badges = getBadges(pullRequest.state);
    if (badges.length > 0) {
      return <StateBox>{badges}</StateBox>;
    }
    return <></>;
  }
);

function getBadges(state: PullRequestState): JSX.Element[] {
  const badges: JSX.Element[] = [];
  if (state.draft) {
    badges.push(DRAFT);
  }
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

function getIncomingStateBadges(state: IncomingState): JSX.Element[] {
  if (state.newReviewRequested) {
    return [UNREVIEWED];
  }
  const badges: JSX.Element[] = [];
  if (state.authorResponded) {
    badges.push(AUTHOR_REPLIED);
  }
  if (state.newCommit) {
    badges.push(NEW_COMMIT);
  }
  return badges;
}

function getOutgoingStateBadges(state: OutgoingState): JSX.Element[] {
  const badges: JSX.Element[] = [];
  switch (state.checkStatus) {
    case "SUCCESS":
      badges.push(CHECK_STATUS_PASSED);
      break;
    case "FAILURE":
      badges.push(CHECK_STATUS_FAILED);
      break;
  }

  if (state.mergeable) {
    badges.push(MERGEABLE);
  }
  if (state.approvedByEveryone) {
    badges.push(APPROVED_BY_EVERONE);
  } else if (state.changesRequested) {
    badges.push(CHANGES_REQUESTED);
  } else {
    badges.push(WAITING_FOR_REVIEW);
    if (state.noReviewers) {
      badges.push(NO_REVIEWER_ASSIGNED);
    }
  }

  return badges;
}
