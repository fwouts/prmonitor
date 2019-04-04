import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { Header } from "./design/Header";
import { Error } from "./Error";
import { Loader } from "./Loader";
import { PullRequestList } from "./PullRequestList";
import { Settings } from "./Settings";

export interface PopupProps {
  github: GitHubState;
}

@observer
export class Popup extends Component<PopupProps> {
  async componentDidMount() {
    await this.props.github.start();
    await this.props.github.refreshPullRequests();
  }

  render() {
    return (
      <>
        <Error lastError={this.props.github.lastError} />
        {this.props.github.token && !this.props.github.lastError && (
          <>
            <Header>Pull requests</Header>
            {this.props.github.unreviewedPullRequests === null ? (
              <Loader />
            ) : (
              <PullRequestList
                pullRequests={this.props.github.unreviewedPullRequests}
              />
            )}
          </>
        )}
        {this.props.github.status !== "loading" && (
          <Settings github={this.props.github} />
        )}
      </>
    );
  }
}
