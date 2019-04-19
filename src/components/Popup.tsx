import { observer } from "mobx-react-lite";
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
                    {this.props.core.filteredPullRequests && (
                      <Badge
                        variant={
                          this.props.core.filteredPullRequests.incoming.length >
                          0
                            ? "danger"
                            : "secondary"
                        }
                      >
                        {this.props.core.filteredPullRequests.incoming.length}
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
                    {this.props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {this.props.core.filteredPullRequests.muted.length}
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
                    {this.props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {this.props.core.filteredPullRequests.reviewed.length}
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
                    {this.props.core.filteredPullRequests && (
                      <Badge variant="secondary">
                        {this.props.core.filteredPullRequests.mine.length}
                      </Badge>
                    )}
                  </>
                }
                eventKey={Filter.MINE}
              />
            </Tabs>
            <PullRequestList
              pullRequests={
                this.props.core.filteredPullRequests
                  ? this.props.core.filteredPullRequests[
                      this.state.currentFilter
                    ]
                  : null
              }
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
    this.props.core.openPullRequest(pullRequestUrl).catch(console.error);
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
