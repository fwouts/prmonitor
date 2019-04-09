import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../state/storage/last-check";
import { List } from "./design/List";
import { Paragraph } from "./design/Paragraph";
import { PullRequestItem } from "./PullRequestItem";

export interface PullRequestListProps {
  pullRequests: PullRequest[];
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
            onMute={this.props.onMute}
          />
        ))}
      </List>
    );
  }
}
