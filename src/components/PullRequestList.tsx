import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React, { useRef, useState } from "react";
import { EnrichedPullRequest } from "../filtering/enriched-pull-request";
import { PullRequest } from "../storage/loaded-state";
import { MuteType } from "../storage/mute-configuration";
import { Link } from "./design/Link";
import { LargeButton } from "./design/Button";
import { Paragraph } from "./design/Paragraph";
import { Loader } from "./Loader";
import { PullRequestItem } from "./PullRequestItem";

const List = styled.div`
  border: 1px solid #ddd;
  border-radius: 0 8px 8px 8px;
  background: #fff;
  margin-bottom: 16px;
`;

const NewCommitsToggle = styled.label`
  padding: 8px;
  margin: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const NewCommitsCheckbox = styled.input`
  margin-right: 8px;
`;

const OnlyDirectRequestsCheckbox = styled.input`
  margin-right: 8px;
`;

const OnlyDirectRequestsToggle = styled.label`
  padding: 8px;
  margin: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const WhitelistedTeamsInput = styled.input`
  flex-grow: 1;
  padding: 4px 8px;
  margin-right: 8px;

  &:focus {
    outline-color: #2ee59d;
  }
`;

const OpenAllParagraph = styled(Paragraph)`
  text-align: center;
  color: #777;
`;

export interface PullRequestListProps {
  pullRequests: EnrichedPullRequest[] | null;
  emptyMessage: string;
  mutingConfiguration: "allow-muting" | "allow-unmuting" | "none";
  newCommitsNotificationToggled: boolean | null;
  onlyDirectRequestsToggled: boolean | null;
  whitelistedTeams: string[];
  userLogin?: string;
  onToggleNewCommitsNotification?(): void;
  onToggleOnlyDirectRequests?(): void;
  onChangeWhitelistedTeams?: (text: string) => void;
  onOpenAll(): void;
  onOpen(pullRequestUrl: string): void;
  onMute(pullRequest: PullRequest, muteType: MuteType): void;
  onUnmute(pullRequest: PullRequest): void;
}

export const PullRequestList = observer((props: PullRequestListProps) => {
  const defaultWhitelistedTeams = props.whitelistedTeams.join(", ");
  const [whitelistedTeams, setWhitelistedTeams] = useState(
    defaultWhitelistedTeams
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const handleWhitelistedTeamsChange = (evt: any) => {
    evt.preventDefault();
    if (!inputRef.current) {
      return;
    }

    setWhitelistedTeams(inputRef.current.value);
  };
  const handleApplyWhitelistedTeamsChange = (evt: any) => {
    evt.preventDefault();
    props.onChangeWhitelistedTeams &&
      props.onChangeWhitelistedTeams(whitelistedTeams);
  };
  return (
    <List>
      {props.onlyDirectRequestsToggled !== null && (
        <OnlyDirectRequestsToggle>
          <OnlyDirectRequestsCheckbox
            type="checkbox"
            checked={props.onlyDirectRequestsToggled}
            onChange={props.onToggleOnlyDirectRequests}
          />
          <div>
            Only directly requested
            {props.userLogin && (
              <span>
                {" "}
                (<b>@{props.userLogin}</b>){" "}
              </span>
            )}
            and whitelisted teams
            {props.onlyDirectRequestsToggled && props.onChangeWhitelistedTeams && (
              <div>
                <WhitelistedTeamsInput
                  ref={inputRef}
                  placeholder="team1, team2"
                  value={whitelistedTeams}
                  onInput={handleWhitelistedTeamsChange}
                ></WhitelistedTeamsInput>
                <LargeButton
                  disabled={whitelistedTeams === defaultWhitelistedTeams}
                  onClick={handleApplyWhitelistedTeamsChange}
                >
                  Apply
                </LargeButton>
              </div>
            )}
          </div>
        </OnlyDirectRequestsToggle>
      )}
      {props.newCommitsNotificationToggled !== null && (
        <NewCommitsToggle>
          <NewCommitsCheckbox
            type="checkbox"
            checked={props.newCommitsNotificationToggled}
            onChange={props.onToggleNewCommitsNotification}
          />
          Notify me of new commits
        </NewCommitsToggle>
      )}
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
              mutingConfiguration={props.mutingConfiguration}
              onOpen={props.onOpen}
              onMute={props.onMute}
              onUnmute={props.onUnmute}
            />
          ))}
          {props.pullRequests.length > 1 && (
            <OpenAllParagraph>
              <Link onClick={props.onOpenAll}>Open them all</Link>
            </OpenAllParagraph>
          )}
        </>
      )}
    </List>
  );
});
