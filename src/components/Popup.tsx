import assertNever from "assert-never";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { Badge, Tab, Tabs } from "react-bootstrap";
import { Filter } from "../filtering/filters";
import { Core } from "../state/core";
import { PullRequest } from "../storage/loaded-state";
import { Error } from "./Error";
import { PullRequestList } from "./PullRequestList";
import { Settings } from "./Settings";

export interface PopupProps {
  core: Core;
}

export interface PopupState {
  currentFilter: Filter;
}

@observer
export class Popup extends Component<PopupProps, PopupState> {
  state = {
    currentFilter: Filter.INCOMING
  };

  async componentDidMount() {
    await this.props.core.load();
    await this.props.core.refreshPullRequests();
  }

  render() {
    const incoming = this.props.core.filteredPullRequests(Filter.INCOMING);
    const muted = this.props.core.filteredPullRequests(Filter.MUTED);
    const reviewed = this.props.core.filteredPullRequests(Filter.REVIEWED);
    const mine = this.props.core.filteredPullRequests(Filter.MINE);
    let currentPullRequests;
    switch (this.state.currentFilter) {
      case Filter.INCOMING:
        currentPullRequests = incoming;
        break;
      case Filter.MUTED:
        currentPullRequests = muted;
        break;
      case Filter.REVIEWED:
        currentPullRequests = reviewed;
        break;
      case Filter.MINE:
        currentPullRequests = mine;
        break;
      default:
        throw assertNever(this.state.currentFilter);
    }
    return (
      <>
        <Error lastError={this.props.core.lastError} />
        {this.props.core.token && !this.props.core.lastError && (
          <>
            <Tabs
              id="popup-tabs"
              activeKey={this.state.currentFilter}
              onSelect={(key: Filter) => this.setState({ currentFilter: key })}
            >
              <Tab
                title={
                  <>
                    Incoming PRs{" "}
                    {incoming && (
                      <Badge
                        variant={incoming.length > 0 ? "danger" : "secondary"}
                      >
                        {incoming.length}
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
                    {muted && <Badge variant="secondary">{muted.length}</Badge>}
                  </>
                }
                eventKey={Filter.MUTED}
              />
              <Tab
                title={
                  <>
                    Already reviewed{" "}
                    {reviewed && (
                      <Badge variant="secondary">{reviewed.length}</Badge>
                    )}
                  </>
                }
                eventKey={Filter.REVIEWED}
              />
              <Tab
                title={
                  <>
                    My PRs{" "}
                    {mine && <Badge variant="secondary">{mine.length}</Badge>}
                  </>
                }
                eventKey={Filter.MINE}
              />
            </Tabs>
            <PullRequestList
              pullRequests={currentPullRequests}
              emptyMessage={
                this.state.currentFilter === Filter.INCOMING
                  ? `Nothing to review, yay!`
                  : `There's nothing to see here.`
              }
              allowMuting={
                this.state.currentFilter === Filter.INCOMING ||
                this.state.currentFilter === Filter.MUTED
              }
              onOpen={this.onOpen}
              onMute={this.onMute}
            />
          </>
        )}
        {this.props.core.overallStatus !== "loading" && (
          <Settings core={this.props.core} />
        )}
      </>
    );
  }

  private onOpen = (pullRequestUrl: string) => {
    this.props.core.openPullRequest(pullRequestUrl);
  };

  private onMute = (pullRequest: PullRequest) => {
    switch (this.state.currentFilter) {
      case Filter.INCOMING:
        this.props.core.mutePullRequest(pullRequest);
        break;
      case Filter.MUTED:
        this.props.core.unmutePullRequest(pullRequest);
        break;
      default:
      // Do nothing.
    }
  };
}
