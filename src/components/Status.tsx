import { observer } from "mobx-react-lite";
import moment from "moment";
import React from "react";
import { Alert } from "react-bootstrap";
import { Core } from "../state/core";
import { Link } from "./design/Link";

export interface StatusProps {
  core: Core;
}

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
  if (props.core.lastError) {
    return (
      <Alert variant="danger">
        <div>Error: {props.core.lastError}</div>
        {lastUpdated}
      </Alert>
    );
  }
  return <Alert variant="info">{lastUpdated || "Loading..."}</Alert>;
});
