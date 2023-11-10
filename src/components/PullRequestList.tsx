import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { Paragraph } from "./design/Paragraph";
import { Loader } from "./Loader";
import { PullRequestItem } from "./PullRequestItem";

const List = styled.div`
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
`;

export interface PullRequestListProps {
  pullRequests: EnrichedPullRequest[] | null;
  emptyMessage: string;
  header: React.ReactNode;
  onOpen(pullRequestUrl: string): void;
}

export const PullRequestList = observer((props: PullRequestListProps) => {
  return (
    <List>
      {props.header}
      {props.pullRequests === null ? (
        <Loader />
      ) : props.pullRequests.length === 0 ? (
        <Paragraph>{props.emptyMessage}</Paragraph>
      ) : (
        <>
          {props.pullRequests.map((pullRequest) => (
            <PullRequestItem
              key={pullRequest.nodeId}
              pullRequest={pullRequest}
              onOpen={props.onOpen}
            />
          ))}
        </>
      )}
    </List>
  );
});
