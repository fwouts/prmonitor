import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { Repo } from "../github/api/repos";
import { RepoSummary } from "../state/storage/repos";
import { Header } from "./design/Header";
import { List } from "./design/List";
import { Paragraph } from "./design/Paragraph";

export interface RepoListProps {
  repos: RepoSummary[];
}

const Repo = styled.li`
  padding: 8px;
  margin: 0;

  :not(:last-child) {
    border-bottom: 1px solid #eee;
  }
`;

const NormalText = styled.span`
  font-weight: normal;
`;

@observer
export class RepoList extends Component<RepoListProps> {
  render() {
    return (
      <>
        <Header>
          Repositories <NormalText>({this.props.repos.length})</NormalText>
        </Header>
        <List>
          {this.props.repos.length === 0 && (
            <Paragraph>
              You are not a member of any GitHub repositories.
            </Paragraph>
          )}
          {this.props.repos.map(repo => (
            <Repo key={`${repo.owner}/${repo.name}`}>
              {repo.owner}/{repo.name}
            </Repo>
          ))}
        </List>
      </>
    );
  }
}
