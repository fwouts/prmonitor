import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { Error } from "./Error";
import { PullRequestList } from "./PullRequestList";
import { RepoList } from "./RepoList";
import { Settings } from "./Settings";
import { Summary } from "./Summary";

export interface PopupProps {
  github: GitHubState;
}

@observer
export class Popup extends Component<PopupProps> {
  async componentDidMount() {
    await this.props.github.start();
  }

  render() {
    return (
      <>
        <Summary github={this.props.github} />
        <Error lastError={this.props.github.lastError} />
        {this.props.github.lastCheck !== null && (
          <RepoList repos={this.props.github.lastCheck.repos} />
        )}
        {this.props.github.unreviewedPullRequests !== null && (
          <PullRequestList
            pullRequests={this.props.github.unreviewedPullRequests}
          />
        )}
        <Settings github={this.props.github} />
      </>
    );
  }
}
