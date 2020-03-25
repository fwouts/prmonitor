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

const UNREVIEWED = (
  <Badge pill variant="danger">
    Unreviewed
  </Badge>
);

const AUTHOR_REPLIED = (
  <Badge pill variant="secondary">
    Author replied
  </Badge>
);

const NEW_COMMIT = (
  <Badge pill variant="primary">
    New commit
  </Badge>
);

const DRAFT = (
  <Badge pill variant="dark">
    Draft
  </Badge>
);

const MERGEABLE = (
  <Badge pill variant="success">
    Mergeable
  </Badge>
);

const APPROVED_BY_EVERONE = (
  <Badge pill variant="success">
    Approved by everyone
  </Badge>
);

const CHANGES_REQUESTED = (
  <Badge pill variant="warning">
    Changes requested
  </Badge>
);

const WAITING_FOR_REVIEW = (
  <Badge pill variant="info">
    Waiting for review
  </Badge>
);

const NO_REVIEWER_ASSIGNED = (
  <Badge pill variant="light">
    No reviewer assigned
  </Badge>
);

export const PullRequestStatus = observer(
  ({ pullRequest }: { pullRequest: EnrichedPullRequest }) => {
    const state = renderState(pullRequest.state);
    if (state) {
      return <StateBox>{state}</StateBox>;
    }
    return <></>;
  }
);

function renderState(state: PullRequestState) {
  switch (state.kind) {
    case "incoming":
      return renderIncomingState(state);
    case "outgoing":
      return addDraftTag(
        state,
        addMergeableTag(state, renderOutgoingState(state))
      );
    default:
      return null;
  }
}

function renderIncomingState(state: IncomingState) {
  if (state.newReviewRequested) {
    return UNREVIEWED;
  } else if (state.authorResponded && state.newCommit) {
    return (
      <>
        {AUTHOR_REPLIED} {NEW_COMMIT}
      </>
    );
  } else if (state.authorResponded) {
    return AUTHOR_REPLIED;
  } else if (state.newCommit) {
    return NEW_COMMIT;
  } else {
    return null;
  }
}

function renderOutgoingState(state: OutgoingState): JSX.Element {
  if (state.approvedByEveryone) {
    return APPROVED_BY_EVERONE;
  } else if (state.changesRequested) {
    return CHANGES_REQUESTED;
  } else if (state.noReviewers) {
    return (
      <>
        {WAITING_FOR_REVIEW} {NO_REVIEWER_ASSIGNED}
      </>
    );
  } else {
    return WAITING_FOR_REVIEW;
  }
}

function addMergeableTag(state: OutgoingState, otherTags: JSX.Element) {
  if (state.mergeable) {
    return (
      <>
        {MERGEABLE} {otherTags}
      </>
    );
  } else {
    return otherTags;
  }
}

function addDraftTag(state: OutgoingState, otherTags: JSX.Element) {
  if (state.draft) {
    return (
      <>
        {DRAFT} {otherTags}
      </>
    );
  } else {
    return otherTags;
  }
}
