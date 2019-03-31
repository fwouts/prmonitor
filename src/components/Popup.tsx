import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { Header } from "./design/Header";
import { Settings } from "./Settings";

export interface PopupProps {
  github: GitHubState;
}

const Error = styled.p`
  border: 1px solid #d00;
  background: #fdd;
  color: #400;
  padding: 8px;
`;

const PullRequestList = styled.ul`
  list-style: none;
  padding: 0;
`;

const PullRequest = styled.li`
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
  padding: 8px;
  margin: 8px 0;
`;

const PullRequestLink = styled.a`
  display: block;
  text-decoration: none;
  color: #333;
`;

@observer
class Popup extends Component<PopupProps> {
  async componentDidMount() {
    await this.props.github.start();
  }

  render() {
    return (
      <div>
        {this.renderLoading()}
        {this.renderUserLogin()}
        {this.renderRepoList()}
        {this.renderPullRequestsSection()}
        <Settings github={this.props.github} />
      </div>
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

  renderRepoList() {
    if (!this.props.github.repoList) {
      return <></>;
    }
    return (
      <div>You have access to {this.props.github.repoList.length} repos</div>
    );
  }

  renderPullRequestsSection() {
    if (this.props.github.lastError) {
      return <Error>Error: {this.props.github.lastError}</Error>;
    }
    return (
      <div>
        <Header>Incoming pull requests</Header>
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
      <PullRequestList>
        {this.props.github.unreviewedPullRequests.map(pullRequest => (
          <PullRequest>
            <PullRequestLink target="_blank" href={pullRequest.html_url}>
              {pullRequest.title}
            </PullRequestLink>
          </PullRequest>
        ))}
      </PullRequestList>
    );
  }
}

export default Popup;
