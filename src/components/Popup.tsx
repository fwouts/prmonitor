import { observer } from "mobx-react";
import React, { Component, FormEvent, RefObject } from "react";
import { chromeApi } from "../chrome";
import { GitHubState } from "../state/github";
import "./Popup.css";

export interface PopupProps {
  github: GitHubState;
}

@observer
class Popup extends Component<PopupProps> {
  state: {
    editing: boolean;
  } = {
    editing: false
  };

  inputRef: RefObject<HTMLInputElement>;

  constructor(props: PopupProps) {
    super(props);
    this.inputRef = React.createRef();
  }

  async componentWillMount() {
    await this.props.github.start();
    if (!this.props.github.token) {
      // Automatically open the form to enter a GitHub token.
      this.setState({
        editing: true
      });
    }
  }

  componentDidMount() {
    this.props.github.start();
  }

  render() {
    return (
      <div className="Popup">
        {this.renderLoading()}
        {this.renderUserLogin()}
        {this.renderPullRequestsSection()}
        {this.renderSettingsSection()}
      </div>
    );
  }

  renderLoading() {
    if (this.props.github.status === "loaded") {
      return <></>;
    }
    return <div className="loading">Please wait...</div>;
  }

  renderUserLogin() {
    if (!this.props.github.user) {
      return <></>;
    }
    return (
      <div className="user-login">
        Signed in as <b>{this.props.github.user.login}</b>
      </div>
    );
  }

  renderPullRequestsSection() {
    if (this.props.github.lastError) {
      return <p className="error">Error: {this.props.github.lastError}</p>;
    }
    return (
      <div className="pull-requests">
        <h1>Incoming pull requests</h1>
        {this.renderPullRequestList()}
      </div>
    );
  }

  renderPullRequestList() {
    if (!this.props.github.token) {
      return <p>Please provide an API token below.</p>;
    }
    if (this.props.github.unreviewedPullRequests === null) {
      return <p>Loading pull requests...</p>;
    }
    if (this.props.github.unreviewedPullRequests.length === 0) {
      return <p>Nothing to review, yay!</p>;
    }
    return (
      <ul>
        {this.props.github.unreviewedPullRequests.map(pullRequest => (
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
          {this.props.github.token
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
