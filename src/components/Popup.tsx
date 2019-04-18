import { observer } from "mobx-react";
import React, { Component } from "react";
import { Core } from "../state/core";
import { PullRequest } from "../storage/loaded-state";
import { Header } from "./design/Header";
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
            <Header>Pull requests</Header>
            {this.props.core.unreviewedPullRequests === null ? (
              <Loader />
            ) : (
              <PullRequestList
                pullRequests={this.props.core.unreviewedPullRequests}
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
    if (
      confirm(
        `Are you sure you want to mute the following pull request?\n\n${
          pullRequest.title
        }\n\nThe pull request will re-appear when the author updates it.`
      )
    ) {
      this.props.core.mutePullRequest(pullRequest);
    }
  };
}
