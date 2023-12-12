import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import moment from "moment";
import React from "react";
import { SmallButton } from "./design/Button";
import { Core } from "../state/core";

export interface StatusProps {
  core: Core;
}

const StatusContainer = styled.div`
  background: #fff;
  flex-grow: 1;
  border: 1px solid #ddd;
  border-radius: 0 8px 8px 8px;
  padding: 12px;
`;

export const Status = observer((props: StatusProps) => {
  const { core } = props;
  const { loadedState } = core ?? {};

  return (
    <StatusContainer style={{ backgroundColor: '#fff', display: 'flex', flexDirection: 'column', width: '100%' }}>
      {core.lastError ? (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>Error: {core.lastError}</div>
          <LastUpdated timestamp={loadedState?.startRefreshTimestamp} />
          <Button onClick={() => {core.triggerBackgroundRefresh()}} title="Refresh" /> 
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {
            core.refreshing ? 
              <div style={{ display: 'flex' }}>
                Refreshing...
              </div> :
              <LastUpdated timestamp={loadedState?.startRefreshTimestamp} />
          }
          {
            core.refreshing ? 
              <Button onClick={() => {core.triggerRestart()}} title="Reload" /> :
              <Button onClick={() => {core.triggerBackgroundRefresh()}} title="Refresh" />
          }
        </div>
      )}
    </StatusContainer>
  );
});

function Button({onClick, title}: {onClick: () => void, title: string}): JSX.Element {
  return (
    <SmallButton onClick={onClick}>
      {title}
    </SmallButton>
  )
}

function LastUpdated({timestamp}: {timestamp: moment.MomentInput}): JSX.Element {
  return (
    <div>
      Last updated{' '}{moment(timestamp).fromNow()}
    </div>
  )
}
