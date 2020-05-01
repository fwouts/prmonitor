import Octokit from "@octokit/rest";
import { throttling } from "@octokit/plugin-throttling";
import { GitHubApi } from "./api";

const ThrottledOctokit = Octokit.plugin(throttling as any);

interface ThrottlingOptions {
  method: string;
  url: string;
  request: {
    retryCount: number;
  };
}

export function buildGitHubApi(token: string): GitHubApi {
  const octokit = new ThrottledOctokit({
    baseUrl: 'https://api.github.<my domain>.com',
    auth: `token ${token}`,
    // https://developer.github.com/v3/pulls/#list-pull-requests
    // Enable Draft Pull Request API.
    previews: ["shadow-cat"],
    throttle: {
      onRateLimit: (retryAfterSeconds: number, options: ThrottlingOptions) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        // Only retry twice.
        if (options.request.retryCount < 2) {
          console.log(`Retrying after ${retryAfterSeconds} seconds!`);
          return true;
        }
        return false;
      },
      onAbuseLimit: (
        _retryAfterSeconds: number,
        options: ThrottlingOptions
      ) => {
        // Does not retry, only logs a warning.
        console.warn(
          `Abuse detected for request ${options.method} ${options.url}`
        );
        return false;
      },
    },
  });
  return {
    async loadAuthenticatedUser() {
      const response = await octokit.users.getAuthenticated({});
      return response.data;
    },
    searchPullRequests(query) {
      return octokit.paginate(
        octokit.search.issuesAndPullRequests.endpoint.merge({
          q: `is:pr ${query}`,
        })
      );
    },
    async loadPullRequestDetails(pr) {
      const response = await octokit.pulls.get({
        owner: pr.repo.owner,
        repo: pr.repo.name,
        pull_number: pr.number,
      });
      return response.data;
    },
    loadReviews(pr) {
      return octokit.paginate(
        octokit.pulls.listReviews.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
        })
      );
    },
    loadComments(pr) {
      return octokit.paginate(
        octokit.issues.listComments.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          issue_number: pr.number,
        })
      );
    },
    loadCommits(pr) {
      return octokit.paginate(
        octokit.pulls.listCommits.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
        })
      );
    },
  };
}
