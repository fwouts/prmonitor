import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { Repo } from "../github/load-all-repos";
import { getCurrentUserLogin } from "../github/load-user";
import {
  getGitHubApiToken as loadApiTokenFromStorage,
  updateGitHubApiToken as saveGitHubTokenToStorage
} from "./storage/auth";

export class GitHubState {
  private octokit: Octokit | null = null;

  @observable tokenValue: TokenValue = {
    kind: "loading"
  };
  @observable userLogin: string | null = null;
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
      this.userLogin = await getCurrentUserLogin(this.octokit);
    } else {
      this.tokenValue = {
        kind: "missing"
      };
      this.octokit = null;
      this.userLogin = null;
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
