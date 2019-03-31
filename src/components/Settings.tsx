import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component, FormEvent, RefObject } from "react";
import { chromeApi } from "../chrome";
import { GitHubState } from "../state/github";
import { Header } from "./design/Header";
import { Link } from "./design/Link";

export interface SettingsProps {
  github: GitHubState;
}

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const TokenInput = styled.input`
  margin-right: 8px;
  flex-grow: 1;
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
        ? !this.props.github.token
        : this.state.editing;
    if (!editing) {
      return (
        <p>
          {this.props.github.token
            ? "You have already provided a GitHub API token."
            : "Please provide a GitHub API token."}{" "}
          <Link href="#" onClick={this.onSettingsEditClick}>
            Update it here.
          </Link>
        </p>
      );
    } else {
      return (
        <form onSubmit={this.onSettingsSubmit}>
          <p>
            Enter a GitHub API token with <b>repo</b> scope (
            <Link
              href="https://github.com/settings/tokens/new?description=PR%20Monitor&amp;scopes=repo"
              target="_blank"
            >
              create a new one
            </Link>
            ):
          </p>
          <Row>
            <TokenInput ref={this.inputRef} />
            <button type="submit">Save</button>
            <button onClick={this.onSettingsCancel}>Cancel</button>
          </Row>
        </form>
      );
    }
  }

  onSettingsEditClick = () => {
    this.setState({
      editing: true
    });
  };

  onSettingsSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!this.inputRef.current) {
      return;
    }
    const token = this.inputRef.current.value;
    this.props.github
      .setNewToken(token)
      .then(() => console.log("GitHub API token updated."));
    this.setState({
      editing: false
    });
    chromeApi.runtime.sendMessage({
      kind: "refresh"
    });
  };

  onSettingsCancel = () => {
    this.setState({
      editing: false
    });
  };
}
