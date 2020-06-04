import styled from "@emotion/styled";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { observer } from "mobx-react-lite";
import React from "react";
import { Dropdown } from "react-bootstrap";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { isRunningAsPopup } from "../popup-environment";
import { PullRequest } from "../storage/loaded-state";
import { MuteType } from "../storage/mute-configuration";
import { SmallButton } from "./design/Button";
import { PullRequestStatus } from "./PullRequestStatus";

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
    text-decoration: none;
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

const InlineDropdown = styled(Dropdown)`
  display: inline-block;
  margin: 0 8px;

  .dropdown-menu {
    font-size: 0.9rem;
  }
`;

export interface PullRequestItemProps {
  pullRequest: EnrichedPullRequest;
  mutingConfiguration: "allow-muting" | "allow-unmuting" | "none";
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest, muteType: MuteType): void;
  onUnmute(pullRequest: PullRequest): void;
}

export const PullRequestItem = observer((props: PullRequestItemProps) => {
  const open = (e: React.MouseEvent) => {
    props.onOpen(props.pullRequest.htmlUrl);
    e.preventDefault();
  };

  const preventDefault = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const createMuteHandler = (muteType: MuteType) => {
    return () => {
      props.onMute(props.pullRequest, muteType);
    };
  };

  const unmute = (e: React.MouseEvent) => {
    props.onUnmute(props.pullRequest);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <PullRequestBox
      key={props.pullRequest.nodeId}
      onClick={isRunningAsPopup() ? open : undefined}
      href={props.pullRequest.htmlUrl}
    >
      <Info>
        <Title>
          {props.pullRequest.title}
          {props.mutingConfiguration === "allow-muting" && (
            <InlineDropdown onClick={preventDefault} alignRight>
              <Dropdown.Toggle
                as={SmallButton}
                id={`mute-dropdown-${props.pullRequest.nodeId}`}
              >
                <FontAwesomeIcon icon="bell-slash" />
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item
                  onSelect={createMuteHandler("next-comment-by-author")}
                >
                  Mute until next comment by author
                </Dropdown.Item>
                <Dropdown.Item onSelect={createMuteHandler("next-update")}>
                  Mute until next update by author
                </Dropdown.Item>
                {props.pullRequest.draft && (
                  <Dropdown.Item onSelect={createMuteHandler("not-draft")}>
                    Mute until not draft
                  </Dropdown.Item>
                )}
                <Dropdown.Item onSelect={createMuteHandler("1-hour")}>
                  Mute for 1 hour
                </Dropdown.Item>
                <Dropdown.Item onSelect={createMuteHandler("forever")}>
                  Mute forever
                </Dropdown.Item>
                <Dropdown.Item onSelect={createMuteHandler("repo")}>
                  Ignore PRs in{" "}
                  <b>{`${props.pullRequest.repoOwner}/${props.pullRequest.repoName}`}</b>
                </Dropdown.Item>
                <Dropdown.Item onSelect={createMuteHandler("owner")}>
                  Ignore all PRs in repositories owned by{" "}
                  <b>{props.pullRequest.repoOwner}</b>
                </Dropdown.Item>
              </Dropdown.Menu>
            </InlineDropdown>
          )}
          {props.mutingConfiguration === "allow-unmuting" && (
            <SmallButton title="Unmute" onClick={unmute}>
              <FontAwesomeIcon icon="bell" />
            </SmallButton>
          )}
        </Title>
        <PullRequestStatus pullRequest={props.pullRequest} />
        <Repo>
          {props.pullRequest.repoOwner}/{props.pullRequest.repoName} (#
          {props.pullRequest.pullRequestNumber})
        </Repo>
      </Info>
      <AuthorBox title={props.pullRequest.author.login}>
        {props.pullRequest.author && (
          <AuthorAvatar src={props.pullRequest.author.avatarUrl} />
        )}
        <AuthorLogin>{props.pullRequest.author.login}</AuthorLogin>
      </AuthorBox>
    </PullRequestBox>
  );
});
