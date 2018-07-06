/*global chrome*/

import React, { Component } from "react";
import "./Popup.css";

class Popup extends Component {
  state = {
    gitHubApiToken: "loading",
    editing: false
  };

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentWillMount() {
    chrome.storage.sync.get(["gitHubApiToken"], result => {
      this.setState({
        gitHubApiToken: result.gitHubApiToken,
        editing: this.state.editing || !result.gitHubApiToken
      });
    });
  }

  render() {
    return <div className="Popup">{this.renderContent()}</div>;
  }

  renderContent() {
    if (this.state.gitHubApiToken === "loading") {
      return <p>Loading...</p>;
    } else if (!this.state.editing) {
      return (
        <div>
          <p>You have already provided a GitHub API token.</p>
          <button onClick={this.onEditClick}>Edit</button>
        </div>
      );
    } else {
      return (
        <form onSubmit={this.onSubmit}>
          <p>Update your GitHub API token:</p>
          <input ref={this.inputRef} defaultValue={this.state.gitHubApiToken} />
          <button type="submit">Save</button>
          <p>
            <a href="https://github.com/settings/tokens" target="_blank">
              Create a token with <b>repo</b> scope
            </a>
          </p>
        </form>
      );
    }
  }

  onEditClick = () => {
    this.setState({
      editing: true
    });
  };

  onSubmit = event => {
    event.preventDefault();
    const token = this.inputRef.current.value;
    chrome.storage.sync.set(
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
  };
}

export default Popup;
