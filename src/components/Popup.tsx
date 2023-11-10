import { observer } from "mobx-react-lite";
import React, { useState } from "react";
import { Badge, Tab, Tabs } from "react-bootstrap";
import { Filter, FilteredPullRequests } from "../filtering/filters";
import { Core } from "../state/core";
import { Loader } from "./Loader";
import { PullRequestList } from "./PullRequestList";
import { Status } from "./Status";
import { isRunningAsPopup } from "../popup-environment";
import { Link } from "./design/Link";
import styled from "@emotion/styled";
import { CopyIcon } from '@primer/octicons-react'
import { Settings } from "./Settings";

const FullScreenLink = styled(Link)`
  opacity: 0.7;
  &:hover {
    opacity: 1;
  }
`;

export interface PopupProps {
  core: Core;
}

export interface PopupState {
  currentFilter: Filter;
}

export const Popup = observer((props: PopupProps) => {
  const { core } = props;
  const { filteredPullRequests: prs } = core ?? {};

  const [state, setState] = useState<PopupState>({
    currentFilter: Filter.ALL,
  });

  const onOpen = (pullRequestUrl: string) => {
    core.openPullRequest(pullRequestUrl).catch(console.error);
  };

  if (core.overallStatus !== "loaded") {
    return <Loader />;
  }

  return (
    <>
      {core.token &&
        // Don't show the list if there was an error, we're not refreshing
        // anymore (because of the error) and we don't have any loaded state.
        !(
          core.lastError &&
          !core.refreshing &&
          !core.loadedState
        ) && (
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between' }}>
              <Tabs
                id="popup-tabs"
                activeKey={state.currentFilter}
                onSelect={(key) => setState({ currentFilter: key as Filter })}
              >
                <Tab
                  title={
                    <>
                      All{" "}
                      {prs?.needsReview && (
                        <Badge pill bg="danger">
                          {prs.needsReview.length}
                        </Badge>
                      )}
                    </>
                  }
                  eventKey={Filter.ALL}
                />
                <Tab
                  title={
                    <>
                      Needs Review{" "}
                      {prs?.needsReview && (
                        <Badge pill bg="danger">
                          {prs.needsReview.length}
                        </Badge>
                      )}
                    </>
                  }
                  eventKey={Filter.NEEDS_REVIEW}
                />
                <Tab
                  title={
                    <>
                      Needs Revision{" "}
                      {prs?.needsRevision && (
                        <Badge pill bg="secondary">
                          {prs.needsRevision.length}
                        </Badge>
                      )}
                    </>
                  }
                  eventKey={Filter.NEEDS_REVISION}
                />
                <Tab
                  title={
                    <>
                      My PRs{" "}
                      {prs?.mine && (
                        <Badge bg="secondary">
                          {prs.mine.length}
                        </Badge>
                      )}
                    </>
                  }
                  eventKey={Filter.MINE}
                />
              </Tabs>
              {isRunningAsPopup() && (
                <FullScreenLink
                  target="_blank"
                  href={`chrome-extension://${chrome.runtime.id}/index.html`}
                >
                  <CopyIcon />
                  
                </FullScreenLink>
              )}
            </div>
            <PullRequests 
              core={core}
              filter={state.currentFilter}
              onOpen={onOpen}
              prs={prs}  
            />
          </div>
        )}
      <div style={{ marginTop: '8px' }}>
        <Settings core={props.core} />
      </div>
    </>
  );
});

function headerForFilter(filter: Filter): string {
  switch(filter) {
    case Filter.NEEDS_REVIEW:
      return "Needs Review";
    case Filter.NEEDS_REVISION:
      return "Needs Revision";
    case Filter.MINE:
      return "My PRs";
    default:
      return "Invalid Filter";
  }
}

function PullRequests({core, filter, prs, onOpen}: {core: Core, filter: Filter, prs: FilteredPullRequests | null, onOpen: (pullRequestUrl: string) => void}): JSX.Element {
  if (filter === Filter.ALL) {
    const filters: Array<Filter> = [
      Filter.NEEDS_REVIEW, 
      Filter.NEEDS_REVISION, 
      Filter.MINE,
    ];    
    return (
      <div style={{display: 'flex', flexDirection: 'column', gap: '8px'}}>
        <div style={{display: 'flex'}}>
          <Status core={core} />
        </div>
        {filters.map((filter: Filter) => {
          return (
            <div style={{display: 'flex', flexDirection: 'column', gap: '4px'}}>
              <div style={{fontSize: 18}}>
                {headerForFilter(filter)}
              </div>
              <PullRequestList
                header={null}
                pullRequests={prs?.[filter] ?? null}
                emptyMessage=""
                onOpen={onOpen}
              />
            </div>
          )
        })}
      </div>
    ) 
  }

  return (
    <PullRequestList
      header={null}
      pullRequests={prs?.[filter] ?? null}
      emptyMessage={
        filter === Filter.NEEDS_REVIEW
          ? `Nothing to review, yay!`
          : `There's nothing to see here.`
      }
      onOpen={onOpen}
    />
  )
}
