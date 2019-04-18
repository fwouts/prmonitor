import Octokit from "@octokit/rest";
import { GitHubApi } from "./api";

export function buildGitHubApi(token: string): GitHubApi {
  const octokit = new Octokit({
    auth: `token ${token}`
  });
  return {
    async loadAuthenticatedUser() {
      const response = await octokit.users.getAuthenticated({});
      return response.data;
    },
    loadRepos() {
      return octokit.paginate(
        octokit.repos.list.endpoint.merge({
          sort: "pushed",
          direction: "desc"
        })
      );
    },
    loadPullRequests(repo, state) {
      return octokit.paginate(
        octokit.pulls.list.endpoint.merge({
          owner: repo.owner,
          repo: repo.name,
          state
        })
      );
    },
    async loadSinglePullRequest(pr) {
      const response = await octokit.pulls.get({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        pull_number: pr.number
      });
      return response.data;
    },
    loadReviews(pr) {
      return octokit.paginate(
        octokit.pulls.listReviews.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number
        })
      );
    },
    loadComments(pr) {
      return octokit.paginate(
        octokit.issues.listComments.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number
        })
      );
    }
  };
}
