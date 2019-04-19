import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { PullRequest } from "../storage/loaded-state";
import { SmallButton } from "./design/Button";

const PullRequestBox = styled.a`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  text-decoration: none;
  border-bottom: 1px solid #eee;
  cursor: pointer;

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

export interface PullRequestItemProps {
  pullRequest: PullRequest;
  allowMuting: boolean;
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest): void;
}

@observer
export class PullRequestItem extends Component<PullRequestItemProps> {
  render() {
    return (
      <PullRequestBox key={this.props.pullRequest.nodeId} onClick={this.open}>
        <Info>
          <Title>
            {this.props.pullRequest.title}
            {this.props.allowMuting && (
              <SmallButton title="Mute until next update" onClick={this.mute}>
                <FontAwesomeIcon icon="bell-slash" />
              </SmallButton>
            )}
          </Title>
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

  private open = (e: React.MouseEvent) => {
    this.props.onOpen(this.props.pullRequest.htmlUrl);
    e.preventDefault();
  };

  private mute = (e: React.MouseEvent) => {
    this.props.onMute(this.props.pullRequest);
    e.preventDefault();
    e.stopPropagation();
  };
}
