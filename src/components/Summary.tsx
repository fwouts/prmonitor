import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";

export interface SummaryProps {
  github: GitHubState;
}

@observer
export class Summary extends Component<SummaryProps> {
  render() {
    return (
      <>
        {this.renderLoading()}
        {this.renderUserLogin()}
      </>
    );
  }

  renderLoading() {
    if (this.props.github.status === "loaded") {
      return <></>;
    }
    return <div>Please wait...</div>;
  }

  renderUserLogin() {
    if (!this.props.github.user) {
      return <></>;
    }
    return (
      <div>
        Signed in as <b>{this.props.github.user.login}</b>
      </div>
    );
  }
}
