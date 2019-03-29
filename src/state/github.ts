import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { Repo } from "../github/api/repos";
import { loadAuthenticatedUser, User } from "../github/api/user";
import {
  getGitHubApiToken as loadApiTokenFromStorage,
  updateGitHubApiToken as saveGitHubTokenToStorage
} from "./storage/auth";

export class GitHubState {
  private octokit: Octokit | null = null;

  @observable tokenValue: TokenValue = {
    kind: "loading"
  };
  @observable user: User | null = null;
  @observable repos: Repo[] | null = [];

  async fetchSignedInUser() {
    const token = await loadApiTokenFromStorage();
    if (token) {
      this.tokenValue = {
        kind: "provided",
        token
      };
      this.octokit = new Octokit({
        auth: `token ${token}`
      });
      this.user = await loadAuthenticatedUser(this.octokit);
    } else {
      this.tokenValue = {
        kind: "missing"
      };
      this.octokit = null;
      this.user = null;
    }
    return this.tokenValue;
  }

  async setNewToken(token: string) {
    this.tokenValue = {
      kind: "provided",
      token
    };
    await saveGitHubTokenToStorage(token);
  }
}

export type TokenValue =
  | {
      kind: "loading";
    }
  | {
      kind: "provided";
      token: string;
    }
  | {
      kind: "missing";
    };
