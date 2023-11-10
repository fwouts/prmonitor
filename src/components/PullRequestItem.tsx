import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { isRunningAsPopup } from "../popup-environment";
import { PullRequestStatus } from "./PullRequestStatus";
import { CommentIcon } from '@primer/octicons-react'
import moment from "moment";
import { IncomingState, OutgoingState } from "../filtering/status";

const PullRequestBox = styled.a`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-decoration: none;
  border-top: 1px solid #ddd;
  cursor: pointer;
  padding: 12px;

  &:first-child {
    border-top: none;
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &:first-child:last-child {
    border-radius: 8px;
  }

  &:hover {
    background: #eef5ff !important;
    text-decoration: none;
  }
`;

const LinesAdded = styled.span`
  color: #22863a;
`;

const LinesDeleted = styled.span`
  color: #cb2431;
`;

const ChangedFiles = styled.span`
  color: #555;
`;

const Repo = styled.span`
  color: #555;
`;

const AuthorAvatarSize = "20px";

const AuthorAvatar = styled.img`
  width: ${AuthorAvatarSize};
  height: ${AuthorAvatarSize};
  border: 2px solid #333;
  border-radius: 50%;
`;

export interface PullRequestItemProps {
  pullRequest: EnrichedPullRequest;
  onOpen(pullRequestUrl: string): void;
}

export const PullRequestItem = observer(({onOpen, pullRequest}: PullRequestItemProps) => {
  const open = (e: React.MouseEvent) => {
    onOpen(pullRequest.htmlUrl);
    e.preventDefault();
  };

  return (
    <PullRequestBox
      key={pullRequest.nodeId}
      onClick={isRunningAsPopup() ? open : undefined}
      href={pullRequest.htmlUrl}
      style={{backgroundColor: itemBgColor(pullRequest)}}
    >
      <div style={{display: 'flex', flexDirection: 'column', width: '100%'}}>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
            <AuthorAvatar src={pullRequest.author?.avatarUrl} />
            <div>{pullRequest.title}{' (#'}{pullRequest.pullRequestNumber}{')'}</div>
          </div>
          <div>{moment(pullRequest.updatedAt).fromNow()}</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: '8px'}}>
            <Repo>{pullRequest.repoOwner}/{pullRequest.repoName}</Repo>
            <div style={{display: 'flex', gap: '8px'}}>
              <LinesAdded>+{pullRequest.changeSummary.additions}</LinesAdded>
              <LinesDeleted>-{pullRequest.changeSummary.deletions}</LinesDeleted>
              <ChangedFiles>@{pullRequest.changeSummary.changedFiles}</ChangedFiles>
              <div><CommentIcon /> {pullRequest.comments.length}</div>
            </div>
          </div>
          <PullRequestStatus pullRequest={pullRequest} />
        </div>
      </div>
    </PullRequestBox>
  );
});

function isIncomingPr(pr: EnrichedPullRequest): boolean {
  switch(pr.state.kind) {
    case "incoming": return true;
    default: return false;
  }
}

function isOutgoingPr(pr: EnrichedPullRequest): boolean {
  switch(pr.state.kind) {
    case "outgoing": return true;
    default: return false;
  }
}

function itemBgColor(pr: EnrichedPullRequest): string {
  if (isIncomingPr(pr) && 
     !(pr.state as IncomingState).changesRequested &&
     moreThanOneDayAgo(pr.updatedAt)) {
    return '#ffeae9';
  }
  if (isOutgoingPr(pr) && 
     (pr.state as OutgoingState).approved) {
    return '#d9fee5';
  }
  if (isOutgoingPr(pr) && 
     !(pr.state as OutgoingState).changesRequested &&
     moreThanOneDayAgo(pr.updatedAt)) {
    return '#ffeae9';
  }
  return '#fff';
}

function moreThanOneDayAgo(timestamp: string) {
  return moment().diff(moment(timestamp), 'days') >= 1;
}
