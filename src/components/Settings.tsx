import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React, { FormEvent, useRef, useState } from "react";
import { Core } from "../state/core";
import { LargeButton } from "./design/Button";
import { Center } from "./design/Center";
import { Link } from "./design/Link";
import { Paragraph } from "./design/Paragraph";
import { Row } from "./design/Row";

const UserLogin = styled.span`
  color: #000;
`;

const TokenInput = styled.input`
  flex-grow: 1;
  padding: 4px 8px;
  margin-right: 8px;

  &:focus {
    outline-color: #2ee59d;
  }
`;

export interface SettingsProps {
  core: Core;
}

export const Settings = observer((props: SettingsProps) => {
  const [state, setState] = useState<{
    editing: boolean | "default";
  }>({
    editing: "default",
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Show the token editing form if:
  // - editing is "default" (user has not said whether they want to open or dismiss the form)
  //   AND the token is not set; or
  // - editing is explicitly set to true (user opened the form).
  const editing =
    state.editing === "default" ? !props.core.token : state.editing;

  const openForm = () => {
    setState({
      editing: true,
    });
  };

  const saveForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!inputRef.current) {
      return;
    }
    const token = inputRef.current.value;
    props.core
      .setNewToken(token)
      .then(() => console.log("GitHub API token updated."));
    setState({
      editing: false,
    });
  };

  const cancelForm = () => {
    setState({
      editing: false,
    });
  };

  return (
    <>
      {!editing ? (
        props.core.loadedState ? (
          <Row>
            <Paragraph>
              Signed in as{" "}
              <UserLogin>
                {props.core.loadedState.userLogin || "unknown"}
              </UserLogin>
            </Paragraph>
            <LargeButton onClick={openForm}>Update token</LargeButton>
          </Row>
        ) : props.core.lastError ? (
          <Row>
            <Paragraph>Is your token valid?</Paragraph>
            <LargeButton onClick={openForm}>Update token</LargeButton>
          </Row>
        ) : props.core.token ? (
          <Row>
            <Paragraph>
              We're loading your pull requests. This could take a while...
            </Paragraph>
            <LargeButton onClick={openForm}>Update token</LargeButton>
          </Row>
        ) : (
          <>
            <Paragraph>
              Welcome to PR Monitor! In order to use this Chrome extension, you
              need to provide a GitHub API token. This will be used to load your
              pull requests.
            </Paragraph>
            <Center>
              <LargeButton onClick={openForm}>Update token</LargeButton>
            </Center>
          </>
        )
      ) : (
        <form onSubmit={saveForm}>
          {!props.core.token && (
            <Paragraph>
              Welcome to PR Monitor! In order to use this Chrome extension, you
              need to provide a GitHub API token. This will be used to load your
              pull requests.
            </Paragraph>
          )}
          <Paragraph>
            Enter a GitHub API token with <b>repo</b> scope (
            <Link
              href="https://github.com/settings/tokens/new?description=PR%20Monitor&amp;scopes=repo"
              target="_blank"
            >
              create a new one
            </Link>
            ):
          </Paragraph>
          <Row>
            <TokenInput ref={inputRef} />
            <LargeButton type="submit">Save</LargeButton>
            <LargeButton onClick={cancelForm}>Cancel</LargeButton>
          </Row>
        </form>
      )}
    </>
  );
});
