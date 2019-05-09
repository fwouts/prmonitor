import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { Badge } from "react-bootstrap";
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

export const PullRequestStatus = observer((props: { status: Status }) => {
  switch (props.status) {
    case Status.INCOMING_NEW_REVIEW_REQUESTED:
      return <StatusBox>{UNREVIEWED}</StatusBox>;
    case Status.INCOMING_REVIEWED_NEW_COMMENT_BY_AUTHOR:
      return <StatusBox>{AUTHOR_REPLIED}</StatusBox>;
    case Status.INCOMING_REVIEWED_NEW_COMMIT:
      return <StatusBox>{NEW_COMMIT}</StatusBox>;
    case Status.INCOMING_REVIEWED_NEW_COMMIT_AND_NEW_COMMENT_BY_AUTHOR:
      return (
        <StatusBox>
          {AUTHOR_REPLIED} {NEW_COMMIT}
        </StatusBox>
      );
    default:
      return <></>;
  }
});
