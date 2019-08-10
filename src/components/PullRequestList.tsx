import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { PullRequest } from "../storage/loaded-state";
import { MuteType } from "../storage/mute-configuration";
import { Paragraph } from "./design/Paragraph";
import { Loader } from "./Loader";
import { PullRequestItem } from "./PullRequestItem";

export const List = styled.div`
  border: 1px solid #ddd;
  border-radius: 0 8px 8px 8px;
  background: #fff;
  margin-bottom: 16px;
`;

export interface PullRequestListProps {
  pullRequests: EnrichedPullRequest[] | null;
  emptyMessage: string;
  mutingConfiguration: "allow-muting" | "allow-unmuting" | "none";
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest, muteType: MuteType): void;
  onUnmute(pullRequest: PullRequest): void;
}

export const PullRequestList = observer((props: PullRequestListProps) => (
  <List>
    {props.pullRequests === null ? (
      <Loader />
    ) : props.pullRequests.length === 0 ? (
      <Paragraph>{props.emptyMessage}</Paragraph>
    ) : (
      props.pullRequests.map(pullRequest => (
        <PullRequestItem
          key={pullRequest.nodeId}
          pullRequest={pullRequest}
          mutingConfiguration={props.mutingConfiguration}
          onOpen={props.onOpen}
          onMute={props.onMute}
          onUnmute={props.onUnmute}
        />
      ))
    )}
  </List>
));
