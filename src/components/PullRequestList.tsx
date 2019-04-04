import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../state/storage/last-check";
import { List } from "./design/List";
import { Paragraph } from "./design/Paragraph";

export interface PullRequestListProps {
  pullRequests: PullRequest[];
}

const PullRequest = styled.a`
  display: flex;
  flex-direction: column;
  text-decoration: none;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #eef5ff;
  }
`;

const Title = styled.div`
  padding: 8px;
  color: #000;
`;

const Information = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 4px 8px;
  font-size: 0.9em;
  color: #555;
`;

const Repo = styled.div`
  width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Author = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

@observer
export class PullRequestList extends Component<PullRequestListProps> {
  render() {
    return this.props.pullRequests.length === 0 ? (
      <Paragraph>Nothing to review, yay!</Paragraph>
    ) : (
      <List>
        {this.props.pullRequests.map(pullRequest => (
          <PullRequest
            key={pullRequest.nodeId}
            target="_blank"
            href={pullRequest.htmlUrl}
          >
            <Title>{pullRequest.title}</Title>
            <Information>
              <Repo>
                {pullRequest.repoOwner}/{pullRequest.repoName}
              </Repo>
              <Author>{pullRequest.authorLogin}</Author>
            </Information>
          </PullRequest>
        ))}
      </List>
    );
  }
}
