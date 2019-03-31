import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { Error } from "./Error";
import { PullRequestList } from "./PullRequestList";
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
        <PullRequestList github={this.props.github} />
        <Settings github={this.props.github} />
      </>
    );
  }
}
