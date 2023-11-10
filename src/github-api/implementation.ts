import { throttling } from "@octokit/plugin-throttling";
import { Octokit } from "@octokit/rest";
import { GitHubApi } from "./api";
import { GraphQLClient, gql } from "graphql-request";

const ThrottledOctokit = Octokit.plugin(throttling);
const graphQLEndpoint = "https://api.github.com/graphql";

interface ThrottlingOptions {
  method: string;
  url: string;
}

export function buildGitHubApi(token: string): GitHubApi {
  const octokit: Octokit = new ThrottledOctokit({
    auth: `token ${token}`,
    // https://developer.github.com/v3/pulls/#list-pull-requests
    // Enable Draft Pull Request API.
    previews: ["shadow-cat"],
    throttle: {
      onRateLimit: (retryAfter: number, options: ThrottlingOptions, _: Octokit, retryCount: number) => {
        console.warn(
          `Request quota exhausted for request ${options.method} ${options.url}`
        );
        // Only retry twice.
        if (retryCount < 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (retryAfter: number, options: ThrottlingOptions, _: Octokit, retryCount: number) => {
        console.warn(
          `Secondary Rate Limit detected for request ${options.method} ${options.url}`
        );
        // Only retry twice.
        if (retryCount < 2) {
          console.log(`Retrying after ${retryAfter} seconds!`);
          return true;
        }
        return false;
      },
    },
  });

  const graphQLClient = new GraphQLClient(graphQLEndpoint, {
    headers: {
      Authorization: `Bearer ${token}`,
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
    loadReviewComments(pr) {
      return octokit.paginate(
        octokit.pulls.listReviewComments.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
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
    async loadPullRequestStatus(pr) {
      const data = await graphQLClient.request(gql`
        query {
          repository(owner: "${pr.repo.owner}", name: "${pr.repo.name}") {
            pullRequest(number: ${pr.number}) {
              reviewDecision
              commits(last: 1) {
                nodes {
                  commit {
                    statusCheckRollup {
                      state
                    }
                  }
                }
              }
            }
          }
        }
      `);

      const pullRequest = data.repository.pullRequest;
      return {
        reviewDecision: pullRequest.reviewDecision,
        checkStatus: pullRequest.commits.nodes?.[0]?.commit.statusCheckRollup?.state,
      };
    },
  };
}
