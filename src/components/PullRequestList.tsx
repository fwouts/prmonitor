import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { GitHubState } from "../state/github";
import { Header } from "./design/Header";

export interface PullRequestListProps {
  github: GitHubState;
}

const Error = styled.p`
  border: 1px solid #d00;
  background: #fdd;
  color: #400;
  padding: 8px;
`;

const List = styled.ul`
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
export class PullRequestList extends Component<PullRequestListProps> {
  render() {
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
      return <p>Please provide an API token.</p>;
    }
    if (this.props.github.unreviewedPullRequests === null) {
      return <p>Loading pull requests...</p>;
    }
    if (this.props.github.unreviewedPullRequests.length === 0) {
      return <p>Nothing to review, yay!</p>;
    }
    return (
      <List>
        {this.props.github.unreviewedPullRequests.map(pullRequest => (
          <PullRequest>
            <PullRequestLink target="_blank" href={pullRequest.html_url}>
              {pullRequest.title}
            </PullRequestLink>
          </PullRequest>
        ))}
      </List>
    );
  }
}
