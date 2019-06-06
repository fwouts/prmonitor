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
  <Badge pill variant="success">
    New commit
  </Badge>
);

const DRAFT = (
  <Badge pill variant="dark">
    Draft
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
    default:
      return null;
  }
}
