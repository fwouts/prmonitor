import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../storage/loaded-state";
import { Paragraph } from "./design/Paragraph";
import { PullRequestItem } from "./PullRequestItem";

export const List = styled.div`
  border: 1px solid #ddd;
  border-radius: 0 8px 8px 8px;
  background: #fff;
  margin-bottom: 16px;
`;

export interface PullRequestListProps {
  pullRequests: PullRequest[];
  emptyMessage: string;
  allowMuting: boolean;
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest): void;
}

@observer
export class PullRequestList extends Component<PullRequestListProps> {
  render() {
    return (
      <List>
        {this.props.pullRequests.length === 0 ? (
          <Paragraph>{this.props.emptyMessage}</Paragraph>
        ) : (
          this.props.pullRequests.map(pullRequest => (
            <PullRequestItem
              key={pullRequest.nodeId}
              pullRequest={pullRequest}
              allowMuting={this.props.allowMuting}
              onOpen={this.props.onOpen}
              onMute={this.props.onMute}
            />
          ))
        )}
      </List>
    );
  }
}
