import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component, FormEvent, RefObject } from "react";
import { chromeApi } from "../chrome";
import { GitHubState } from "../state/github";

export interface PopupProps {
  github: GitHubState;
}

const Header = styled.h1`
  font-size: 14px;
  text-align: left;
`;

const Link = styled.a`
  text-decoration: none;
`;

const Error = styled.p`
  border: 1px solid #d00;
  background: #fdd;
  color: #400;
  padding: 8px;
`;

const PullRequestList = styled.ul`
  list-style: none;
  padding: 0;
`;

const PullRequest = styled.li`
  box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  border: 1px solid #ddd;
  padding: 8px;
  margin: 8px 0;
`;

const PullRequestLink = styled.a`
  display: block;
  text-decoration: none;
  color: #333;
`;

const Row = styled.div`
  display: flex;
  flex-direction: row;
`;

const TokenInput = styled.input`
  margin-right: 8px;
  flex-grow: 1;
`;

@observer
class Popup extends Component<PopupProps> {
  state: {
    editing: boolean;
  } = {
    editing: false
  };

  inputRef: RefObject<HTMLInputElement>;

  constructor(props: PopupProps) {
    super(props);
    this.inputRef = React.createRef();
  }

  async componentWillMount() {
    await this.props.github.start();
    if (!this.props.github.token) {
      // Automatically open the form to enter a GitHub token.
      this.setState({
        editing: true
      });
    }
  }

  componentDidMount() {
    this.props.github.start();
  }

  render() {
    return (
      <div>
        {this.renderLoading()}
        {this.renderUserLogin()}
        {this.renderRepoList()}
        {this.renderPullRequestsSection()}
        {this.renderSettingsSection()}
      </div>
    );
  }

  renderLoading() {
    if (this.props.github.status === "loaded") {
      return <></>;
    }
    return <div>Please wait...</div>;
  }

  renderUserLogin() {
    if (!this.props.github.user) {
      return <></>;
    }
    return (
      <div>
        Signed in as <b>{this.props.github.user.login}</b>
      </div>
    );
  }

  renderRepoList() {
    if (!this.props.github.repoList) {
      return <></>;
    }
    return (
      <div>You have access to {this.props.github.repoList.length} repos</div>
    );
  }

  renderPullRequestsSection() {
    if (this.props.github.lastError) {
      return <Error>Error: {this.props.github.lastError}</Error>;
    }
    return (
      <div>
        <Header>Incoming pull requests</Header>
        {this.renderPullRequestList()}
      </div>
    );
  }

  renderPullRequestList() {
    if (!this.props.github.token) {
      return <p>Please provide an API token below.</p>;
    }
    if (this.props.github.unreviewedPullRequests === null) {
      return <p>Loading pull requests...</p>;
    }
    if (this.props.github.unreviewedPullRequests.length === 0) {
      return <p>Nothing to review, yay!</p>;
    }
    return (
      <PullRequestList>
        {this.props.github.unreviewedPullRequests.map(pullRequest => (
          <PullRequest>
            <PullRequestLink target="_blank" href={pullRequest.html_url}>
              {pullRequest.title}
            </PullRequestLink>
          </PullRequest>
        ))}
      </PullRequestList>
    );
  }

  renderSettingsSection() {
    return (
      <>
        <Header>Settings</Header>
        {this.renderSettingsContent()}
      </>
    );
  }

  renderSettingsContent() {
    if (!this.state.editing) {
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
            <Link href="https://github.com/settings/tokens" target="_blank">
              create one
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

export default Popup;
