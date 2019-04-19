import { observer } from "mobx-react";
import React, { Component } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { Filter } from "../filtering/filters";
import { Core } from "../state/core";
import { PullRequest } from "../storage/loaded-state";
import { Error } from "./Error";
import { Loader } from "./Loader";
import { PullRequestList } from "./PullRequestList";
import { Settings } from "./Settings";

export interface PopupProps {
  core: Core;
}

@observer
export class Popup extends Component<PopupProps> {
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
              activeKey={this.props.core.filter}
              onSelect={(key: Filter) => (this.props.core.filter = key)}
            >
              <Tab title="Incoming PRs" eventKey={Filter.INCOMING} />
              <Tab title="Muted" eventKey={Filter.MUTED} />
              <Tab title="Already reviewed" eventKey={Filter.REVIEWED} />
              <Tab title="My pull requests" eventKey={Filter.MINE} />
            </Tabs>
            {this.props.core.filteredPullRequests === null ? (
              <Loader />
            ) : (
              <PullRequestList
                pullRequests={this.props.core.filteredPullRequests}
                allowMuting={
                  this.props.core.filter === Filter.INCOMING ||
                  this.props.core.filter === Filter.MUTED
                }
                onOpen={this.onOpen}
                onMute={this.onMute}
              />
            )}
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
    switch (this.props.core.filter) {
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
