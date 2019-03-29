import { observer } from "mobx-react";
import React, { Component, FormEvent, RefObject } from "react";
import { chromeApi } from "../chrome";
import { PullRequest } from "../github/load-all-pull-requests";
import { GitHubState } from "../state/github";
import "./Popup.css";

export interface PopupProps {
  github: GitHubState;
}

@observer
class Popup extends Component<PopupProps> {
  state: {
    unreviewedPullRequests: PullRequest[];
    editing: boolean;
    error: string | null;
  } = {
    unreviewedPullRequests: [],
    editing: false,
    error: null
  };

  inputRef: RefObject<HTMLInputElement>;

  constructor(props: PopupProps) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentWillMount() {
    chromeApi.storage.local.get(["unreviewedPullRequests", "error"], result => {
      this.setState({
        unreviewedPullRequests: result.unreviewedPullRequests || [],
        error: result.error || null
      });
    });
    this.props.github.fetchToken().then(tokenValue => {
      if (tokenValue.kind === "missing") {
        // Automatically open the form to enter a GitHub token.
        this.setState({
          editing: true
        });
      }
    });
  }

  componentDidMount() {
    this.props.github.fetchToken();
  }

  render() {
    return (
      <div className="Popup">
        {this.renderPullRequestsSection()}
        {this.renderSettingsSection()}
      </div>
    );
  }

  renderPullRequestsSection() {
    return (
      <div className="pull-requests">
        <h1>Incoming pull requests</h1>
        {this.renderPullRequestList()}
      </div>
    );
  }

  renderPullRequestList() {
    if (this.state.error) {
      return <p className="error">Error: {this.state.error}</p>;
    }
    if (this.props.github.tokenValue.kind === "missing") {
      return <p>Please provide an API token below.</p>;
    }
    if (this.state.unreviewedPullRequests.length === 0) {
      return <p>Nothing to review, yay!</p>;
    }
    return (
      <ul>
        {this.state.unreviewedPullRequests.map(pullRequest => (
          <li>
            <a target="_blank" href={pullRequest.html_url}>
              {pullRequest.title}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  renderSettingsSection() {
    return (
      <div className="settings">
        <h1>Settings</h1>
        {this.renderSettingsContent()}
      </div>
    );
  }

  renderSettingsContent() {
    if (!this.state.editing) {
      return (
        <p>
          {this.props.github.tokenValue.kind === "provided"
            ? "You have already provided a GitHub API token."
            : "Please provide a GitHub API token."}{" "}
          <a href="#" onClick={this.onSettingsEditClick}>
            Update it here.
          </a>
        </p>
      );
    } else {
      return (
        <form onSubmit={this.onSettingsSubmit}>
          <p>
            Enter a GitHub API token with <b>repo</b> scope (
            <a href="https://github.com/settings/tokens" target="_blank">
              create one
            </a>
            ):
          </p>
          <div className="settings-input-singleline">
            <input ref={this.inputRef} />
            <button type="submit">Save</button>
            <button onClick={this.onSettingsCancel}>Cancel</button>
          </div>
        </form>
      );
    }
  }

  onSettingsEditClick = () => {
    this.setState({
      editing: true
    });
  };

  onSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!this.inputRef.current) {
      return;
    }
    const token = this.inputRef.current.value;
    this.props.github
      .setNewToken(token)
      .then(() => console.log("GitHub API token updated."));
    this.setState({
      editing: false
    });
    chromeApi.runtime.sendMessage({
      kind: "refresh"
    });
  };

  onSettingsCancel = () => {
    this.setState({
      editing: false
    });
  };
}

export default Popup;
