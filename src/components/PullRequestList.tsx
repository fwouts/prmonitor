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
  flex-direction: row;
  justify-content: space-between;
  text-decoration: none;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #eef5ff;
  }
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

const Title = styled.div`
  color: #000;
  padding: 8px;
`;

const Repo = styled.div`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 0.9em;
  color: #555;
  padding: 8px;
`;

const AuthorWidth = "80px";
const AuthorAvatarSize = "40px";

const AuthorBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: ${AuthorWidth};
  padding: 8px;
`;

const AuthorAvatar = styled.img`
  width: ${AuthorAvatarSize};
  height: ${AuthorAvatarSize};
  border: 2px solid #333;
  border-radius: 50%;
`;

const AuthorLogin = styled.div`
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  font-size: 0.9em;
  color: #555;
  max-width: ${AuthorWidth};
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
            <Info>
              <Title>{pullRequest.title}</Title>
              <Repo>
                {pullRequest.repoOwner}/{pullRequest.repoName} (#
                {pullRequest.pullRequestNumber})
              </Repo>
            </Info>
            <AuthorBox title={pullRequest.authorLogin}>
              {pullRequest.author && (
                <AuthorAvatar src={pullRequest.author.avatarUrl} />
              )}
              <AuthorLogin>{pullRequest.authorLogin}</AuthorLogin>
            </AuthorBox>
          </PullRequest>
        ))}
      </List>
    );
  }
}
