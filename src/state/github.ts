import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { Repo } from "../github/load-all-repos";
import { getCurrentUserLogin } from "../github/load-user";
import {
  getGitHubApiToken as loadApiTokenFromStorage,
  updateGitHubApiToken as saveGitHubTokenToStorage
} from "./storage/auth";

export class GitHubState {
  private octokit = new Octokit();

  @observable tokenValue: TokenValue = {
    kind: "loading"
  };
  @observable userLogin: string | null = null;
  @observable repos: Repo[] | null = [];

  async fetchToken() {
    const token = await loadApiTokenFromStorage();
    this.tokenValue = token
      ? {
          kind: "provided",
          token
        }
      : {
          kind: "missing"
        };
    return this.tokenValue;
  }

  async setNewToken(token: string) {
    this.tokenValue = {
      kind: "provided",
      token
    };
    await saveGitHubTokenToStorage(token);
  }

  async fetchUser() {
    if (this.tokenValue.kind !== "provided") {
      this.userLogin = null;
      return;
    }
    this.octokit.authenticate({
      type: "token",
      token: this.tokenValue.token
    });
    this.userLogin = await getCurrentUserLogin(this.octokit);
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
