import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { Badge, Tab, Tabs } from "react-bootstrap";
import { Filter } from "../filtering/filters";
import { Core } from "../state/core";
import { PullRequest } from "../storage/loaded-state";
import { PullRequestList } from "./PullRequestList";
import { Settings } from "./Settings";
import { Status } from "./Status";

export interface PopupProps {
  core: Core;
}

export interface PopupState {
  currentFilter: Filter;
}

export const Popup = observer((props: PopupProps) => {
  const [state, setState] = useState<PopupState>({
    currentFilter: Filter.INCOMING
  });

  const onOpen = (pullRequestUrl: string) => {
    props.core.openPullRequest(pullRequestUrl).catch(console.error);
  };

  const onMute = (pullRequest: PullRequest) => {
    switch (state.currentFilter) {
      case Filter.INCOMING:
        props.core.mutePullRequest(pullRequest);
        break;
      case Filter.MUTED:
        props.core.unmutePullRequest(pullRequest);
        break;
      default:
      // Do nothing.
    }
  };

  return (
    <>
      <Status core={props.core} />
      {props.core.token &&
        // Don't show the list if there was an error, we're not refreshing
        // anymore (because of the error) and we don't have any loaded state.
        !(
          props.core.lastError &&
          !props.core.refreshing &&
          !props.core.loadedState
        ) && (
          <>
            <Tabs
              id="popup-tabs"
              activeKey={state.currentFilter}
              onSelect={(key: string) =>
                setState({ currentFilter: key as Filter })
              }
            >
              <Tab
                title={
                  <>
                    Incoming PRs{" "}
                    {props.core.filteredPullRequests && (
                      <Badge
                        variant={
                          props.core.filteredPullRequests.incoming.length > 0
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {props.core.filteredPullRequests.incoming.length}
                      </Badge>
                    )}
                  </>
                }
                eventKey={Filter.INCOMING}
              />
              <Tab
                title={
                  <>
                    Muted{" "}
                    {props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {props.core.filteredPullRequests.muted.length}
                      </Badge>
                    )}
                  </>
                }
                eventKey={Filter.MUTED}
              />
              <Tab
                title={
                  <>
                    Already reviewed{" "}
                    {props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {props.core.filteredPullRequests.reviewed.length}
                      </Badge>
                    )}
                  </>
                }
                eventKey={Filter.REVIEWED}
              />
              <Tab
                title={
                  <>
                    My PRs{" "}
                    {props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {props.core.filteredPullRequests.mine.length}
                      </Badge>
                    )}
                  </>
                }
                eventKey={Filter.MINE}
              />
            </Tabs>
            <PullRequestList
              pullRequests={
                props.core.filteredPullRequests
                  ? props.core.filteredPullRequests[state.currentFilter]
                  : null
              }
              emptyMessage={
                state.currentFilter === Filter.INCOMING
                  ? `Nothing to review, yay!`
                  : `There's nothing to see here.`
              }
              allowMuting={
                state.currentFilter === Filter.INCOMING ||
                state.currentFilter === Filter.MUTED
              }
              onOpen={onOpen}
              onMute={onMute}
            />
          </>
        )}
      {props.core.overallStatus !== "loading" && <Settings core={props.core} />}
    </>
  );
});
