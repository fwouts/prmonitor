import React, { Component, FormEvent, RefObject } from "react";
import { getGitHubApiToken, updateGitHubApiToken } from "./auth";
import { PullRequest } from "./models";
import "./Popup.css";

class Popup extends Component {
  state: {
    gitHubApiTokenProvided: boolean;
    unreviewedPullRequests: PullRequest[];
    editing: boolean;
    error: string | null;
  } = {
    gitHubApiTokenProvided: false,
    unreviewedPullRequests: [],
    editing: false,
    error: null
  };

  inputRef: RefObject<HTMLInputElement>;

  constructor(props: {}) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentWillMount() {
    chrome.storage.local.get(["unreviewedPullRequests", "error"], result => {
      this.setState({
        unreviewedPullRequests: result.unreviewedPullRequests || [],
        error: result.error || null
      });
    });
    getGitHubApiToken()
      .then(() =>
        // Token is present.
        this.setState({
          gitHubApiTokenProvided: true
        })
      )
      .catch(() =>
        // Token is absent.
        this.setState({
          gitHubApiTokenProvided: false,
          editing: true
        })
      );
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
    if (!this.state.gitHubApiTokenProvided) {
      return <p>Please provide an API token below.</p>;
    }
    if (this.state.unreviewedPullRequests.length === 0) {
      return <p>Nothing to review, yay!</p>;
    }
    return (
      <ul>
        {this.state.unreviewedPullRequests.map(pullRequest => (
          <li>
            <a target="_blank" href={pullRequest.url}>
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
          {this.state.gitHubApiTokenProvided
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
            Enter a GitHub API token with <b>repo</b> scope (<a
              href="https://github.com/settings/tokens"
              target="_blank"
            >
              create one
            </a>):
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
    updateGitHubApiToken(token).then(() =>
      console.log("GitHub API token updated.")
    );
    this.setState({
      gitHubApiTokenProvided: true,
      editing: false
    });
    chrome.runtime.sendMessage({
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
