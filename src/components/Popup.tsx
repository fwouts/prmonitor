import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { PullRequestList } from "./PullRequestList";
import { Settings } from "./Settings";
import { Summary } from "./Summary";

export interface PopupProps {
  github: GitHubState;
}

@observer
class Popup extends Component<PopupProps> {
  async componentDidMount() {
    await this.props.github.start();
  }

  render() {
    return (
      <div>
        <Summary github={this.props.github} />
        <PullRequestList github={this.props.github} />
        <Settings github={this.props.github} />
      </div>
    );
  }
}

export default Popup;
