import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component, FormEvent, RefObject } from "react";
import { Core } from "../state/core";
import { LargeButton } from "./design/Button";
import { Center } from "./design/Center";
import { Header } from "./design/Header";
import { Link } from "./design/Link";
import { Paragraph } from "./design/Paragraph";
import { Row } from "./design/Row";

export interface SettingsProps {
  core: Core;
}

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

@observer
export class Settings extends Component<SettingsProps> {
  state: {
    editing: boolean | "default";
  } = {
    editing: "default"
  };

  private inputRef: RefObject<HTMLInputElement>;

  constructor(props: SettingsProps) {
    super(props);
    this.inputRef = React.createRef();
  }

  render() {
    return (
      <>
        <Header>Settings</Header>
        {this.renderSettingsContent()}
      </>
    );
  }

  renderSettingsContent() {
    // Show the token editing form if:
    // - editing is "default" (user has not said whether they want to open or dismiss the form)
    //   AND the token is not set; or
    // - editing is explicitly set to true (user opened the form).
    const editing =
      this.state.editing === "default"
        ? !this.props.core.token
        : this.state.editing;
    if (!editing) {
      return this.props.core.lastCheck ? (
        <Paragraph>
          <Row>
            <span>
              Signed in as{" "}
              <UserLogin>
                {this.props.core.lastCheck.userLogin || "unknown"}
              </UserLogin>
              .
            </span>
            <LargeButton onClick={this.openForm}>Update token</LargeButton>
          </Row>
        </Paragraph>
      ) : this.props.core.lastError ? (
        <Paragraph>
          <Row>
            Is your token valid?
            <LargeButton onClick={this.openForm}>Update token</LargeButton>
          </Row>
        </Paragraph>
      ) : this.props.core.token ? (
        <Paragraph>
          <Row>
            We're loading your pull requests. This could take a while...
            <LargeButton onClick={this.openForm}>Update token</LargeButton>
          </Row>
        </Paragraph>
      ) : (
        <>
          <Paragraph>
            Welcome to PR Monitor! In order to use this Chrome extension, you
            need to provide a GitHub API token. This will be used to load your
            pull requests.
          </Paragraph>
          <Center>
            <LargeButton onClick={this.openForm}>Update token</LargeButton>
          </Center>
        </>
      );
    } else {
      return (
        <form onSubmit={this.saveForm}>
          {!this.props.core.token && (
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
            <TokenInput ref={this.inputRef} />
            <LargeButton type="submit">Save</LargeButton>
            <LargeButton onClick={this.cancelForm}>Cancel</LargeButton>
          </Row>
        </form>
      );
    }
  }

  openForm = () => {
    this.setState({
      editing: true
    });
  };

  saveForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!this.inputRef.current) {
      return;
    }
    const token = this.inputRef.current.value;
    this.props.core
      .setNewToken(token)
      .then(() => console.log("GitHub API token updated."));
    this.setState({
      editing: false
    });
  };

  cancelForm = () => {
    this.setState({
      editing: false
    });
  };
}
