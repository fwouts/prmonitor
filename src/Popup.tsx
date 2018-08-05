import React, { Component, RefObject, FormEvent } from "react";
import "./Popup.css";
import { PullRequest } from "./models";

class Popup extends Component {
  state: {
    gitHubApiToken: string;
    unreviewedPullRequests: PullRequest[];
    editing: boolean;
    error: string | null;
  } = {
    gitHubApiToken: "loading",
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
    chrome.storage.local.get(
      ["gitHubApiToken", "unreviewedPullRequests", "error"],
      result => {
        this.setState({
          gitHubApiToken: result.gitHubApiToken,
          unreviewedPullRequests: result.unreviewedPullRequests || [],
          error: result.error || null,
          editing: this.state.editing || !result.gitHubApiToken
        });
      }
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
    if (!this.state.gitHubApiToken) {
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
    if (this.state.gitHubApiToken === "loading") {
      return <p>Loading...</p>;
    } else if (!this.state.editing) {
      return (
        <p>
          You have already provided a GitHub API token.{" "}
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
            <input
              ref={this.inputRef}
              defaultValue={this.state.gitHubApiToken}
            />
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
    chrome.storage.local.set(
      {
        gitHubApiToken: token
      },
      () => {
        console.log("GitHub API token updated.");
      }
    );
    this.setState({
      gitHubApiToken: token,
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
