import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { Badge } from "react-bootstrap";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { PullRequestStatus as Status } from "../filtering/status";

const StatusBox = styled.div`
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

const APPROVED = (
  <Badge pill variant="success">
    Approved
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
    const status = renderStatus(pullRequest.status);
    const draft = pullRequest.draft && DRAFT;
    if (status || draft) {
      return (
        <StatusBox>
          {draft} {status}
        </StatusBox>
      );
    }
    return <></>;
  }
);

function renderStatus(status: Status) {
  switch (status) {
    case Status.INCOMING_NEW_REVIEW_REQUESTED:
      return UNREVIEWED;
    case Status.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR:
      return AUTHOR_REPLIED;
    case Status.INCOMING_REVIEWED_NEW_COMMIT:
      return NEW_COMMIT;
    case Status.INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR:
      return (
        <>
          {AUTHOR_REPLIED} {NEW_COMMIT}
        </>
      );
    case Status.OUTGOING_APPROVED:
      return APPROVED;
    case Status.OUTGOING_PENDING_CHANGES:
      return CHANGES_REQUESTED;
    case Status.OUTGOING_PENDING_REVIEW_HAS_REVIEWERS:
      return WAITING_FOR_REVIEW;
    case Status.OUTGOING_PENDING_REVIEW_NO_REVIEWERS:
      return (
        <>
          {WAITING_FOR_REVIEW} {NO_REVIEWER_ASSIGNED}
        </>
      );
    default:
      return null;
  }
}
