import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../storage/loaded-state";
import { List } from "./design/List";
import { Paragraph } from "./design/Paragraph";
import { PullRequestItem } from "./PullRequestItem";

export interface PullRequestListProps {
  pullRequests: PullRequest[];
  allowMuting: boolean;
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest): void;
}

@observer
export class PullRequestList extends Component<PullRequestListProps> {
  render() {
    return this.props.pullRequests.length === 0 ? (
      <Paragraph>Nothing to review, yay!</Paragraph>
    ) : (
      <List>
        {this.props.pullRequests.map(pullRequest => (
          <PullRequestItem
            key={pullRequest.nodeId}
            pullRequest={pullRequest}
            allowMuting={this.props.allowMuting}
            onOpen={this.props.onOpen}
            onMute={this.props.onMute}
          />
        ))}
      </List>
    );
  }
}
