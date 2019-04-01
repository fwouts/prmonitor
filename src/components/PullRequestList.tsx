import styled from "@emotion/styled";
import { PullsListResponseItem } from "@octokit/rest";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { Header } from "./design/Header";
import { List } from "./design/List";
import { Paragraph } from "./design/Paragraph";

export interface PullRequestListProps {
  pullRequests: PullsListResponseItem[];
}

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
    return (
      <>
        <Header>Pull requests</Header>
        {this.props.pullRequests.length === 0 ? (
          <Paragraph>Nothing to review, yay!</Paragraph>
        ) : (
          <List>
            {this.props.pullRequests.map(pullRequest => (
              <PullRequest key={pullRequest.id}>
                <PullRequestLink target="_blank" href={pullRequest.html_url}>
                  {pullRequest.title}
                </PullRequestLink>
              </PullRequest>
            ))}
          </List>
        )}
      </>
    );
  }
}
