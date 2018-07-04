/*global chrome*/

import React, { Component } from "react";
import "./Popup.css";

class Popup extends Component {
  state = {
    gitHubApiToken: "loading"
  };

  constructor(props) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentWillMount() {
    chrome.storage.sync.get(["gitHubApiToken"], result => {
      this.setState({
        gitHubApiToken: result.gitHubApiToken
      });
    });
  }

  render() {
    return <div className="Popup">{this.renderContent()}</div>;
  }

  renderContent() {
    if (this.state.gitHubApiToken === "loading") {
      return <p>Loading...</p>;
    } else {
      return (
        <form onSubmit={this.onSubmit} className="github-token-form">
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
      gitHubApiToken: token
    });
  };
}

export default Popup;
