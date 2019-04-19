import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React from "react";
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

export const PullRequestItem = observer((props: PullRequestItemProps) => {
  const open = (e: React.MouseEvent) => {
    props.onOpen(props.pullRequest.htmlUrl);
    e.preventDefault();
  };

  const mute = (e: React.MouseEvent) => {
    props.onMute(props.pullRequest);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <PullRequestBox key={props.pullRequest.nodeId} onClick={open}>
      <Info>
        <Title>
          {props.pullRequest.title}
          {props.allowMuting && (
            <SmallButton title="Mute until next update" onClick={mute}>
              <FontAwesomeIcon icon="bell-slash" />
            </SmallButton>
          )}
        </Title>
        <Repo>
          {props.pullRequest.repoOwner}/{props.pullRequest.repoName} (#
          {props.pullRequest.pullRequestNumber})
        </Repo>
      </Info>
      <AuthorBox title={props.pullRequest.authorLogin}>
        {props.pullRequest.author && (
          <AuthorAvatar src={props.pullRequest.author.avatarUrl} />
        )}
        <AuthorLogin>{props.pullRequest.authorLogin}</AuthorLogin>
      </AuthorBox>
    </PullRequestBox>
  );
});
