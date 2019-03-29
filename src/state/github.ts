import Octokit from "@octokit/rest";
import { observable } from "mobx";
import { getGitHubApiToken } from "../auth";
import { Repo } from "../github/load-all-repos";
import { getCurrentUserLogin } from "../github/load-user";

export class GitHub {
  private octokit: Octokit | null = null;

  @observable token: string | null = null;
  @observable userLogin: string | null = null;
  @observable repos: Repo[] | null = [];

  async fetchToken() {
    this.token = await getGitHubApiToken();
    this.octokit = new Octokit({
      auth: "token",
      token: this.token
    });
    console.log(await getCurrentUserLogin(this.octokit));
  }
}
