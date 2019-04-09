import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../state/storage/last-check";

export interface PullRequestItemProps {
  pullRequest: PullRequest;
}

const PullRequestBox = styled.a`
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
export class PullRequestItem extends Component<PullRequestItemProps> {
  render() {
    return (
      <PullRequestBox
        key={this.props.pullRequest.nodeId}
        target="_blank"
        href={this.props.pullRequest.htmlUrl}
      >
        <Info>
          <Title>{this.props.pullRequest.title}</Title>
          <Repo>
            {this.props.pullRequest.repoOwner}/{this.props.pullRequest.repoName}{" "}
            (#
            {this.props.pullRequest.pullRequestNumber})
          </Repo>
        </Info>
        <AuthorBox title={this.props.pullRequest.authorLogin}>
          {this.props.pullRequest.author && (
            <AuthorAvatar src={this.props.pullRequest.author.avatarUrl} />
          )}
          <AuthorLogin>{this.props.pullRequest.authorLogin}</AuthorLogin>
        </AuthorBox>
      </PullRequestBox>
    );
  }
}
