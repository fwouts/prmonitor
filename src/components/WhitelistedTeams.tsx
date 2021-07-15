import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React, { useRef, useState } from "react";
import { LargeButton } from "./design/Button";

export interface WhitelistedTeamsProps {
  onlyDirectRequestsToggled: boolean;
  whitelistedTeams: string[];
  userLogin?: string;
  onToggleOnlyDirectRequests(): void;
  onChangeWhitelistedTeams(text: string): void;
}

export const WhitelistedTeams = observer((props: WhitelistedTeamsProps) => {
  const defaultWhitelistedTeams = props.whitelistedTeams.join(", ");
  const [whitelistedTeams, setWhitelistedTeams] = useState(
    defaultWhitelistedTeams
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const handleWhitelistedTeamsChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputRef.current) {
      return;
    }

    setWhitelistedTeams(inputRef.current.value);
  };
  const handleApplyWhitelistedTeamsChange = (e: React.FormEvent) => {
    e.preventDefault();
    props.onChangeWhitelistedTeams(whitelistedTeams);
  };
  return (
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
        )}{" "}
        and whitelisted teams
        {props.onlyDirectRequestsToggled && (
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
  );
});

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
