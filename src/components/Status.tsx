import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import moment from "moment";
import React from "react";
import { Alert } from "react-bootstrap";
import { Core } from "../state/core";
import { Link } from "./design/Link";

export interface StatusProps {
  core: Core;
}

const StatusContainer = styled.div`
  flex-grow: 1;
`;

export const Status = observer((props: StatusProps) => {
  let lastUpdated;
  if (props.core.loadedState && props.core.loadedState.startRefreshTimestamp) {
    lastUpdated = (
      <div>
        Last updated{" "}
        {moment(props.core.loadedState.startRefreshTimestamp).fromNow()}
        {". "}
        {props.core.refreshing ? (
          "Refreshing..."
        ) : (
          <Link
            onClick={() => {
              props.core.triggerBackgroundRefresh();
            }}
          >
            Refresh now
          </Link>
        )}
      </div>
    );
  }
  return (
    <StatusContainer>
      {props.core.lastError ? (
        <Alert variant="danger">
          <div>Error: {props.core.lastError}</div>
          {lastUpdated}
        </Alert>
      ) : (
        <Alert variant="info">
          {lastUpdated ||
            (props.core.refreshing ? "Loading..." : "Welcome to PR Monitor!")}
        </Alert>
      )}
    </StatusContainer>
  );
});
