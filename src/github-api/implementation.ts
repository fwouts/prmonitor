import { throttling } from "@octokit/plugin-throttling";
//import { Thr } from "@octokit/plugin-throttling/dist-types/types";
import { Octokit } from "@octokit/rest";
import { GitHubApi } from "./api";
import { GraphQLClient, gql } from "graphql-request";

const ThrottledOctokit = Octokit.plugin(throttling as any);
const graphQLEndpoint = "https://api.github.com/graphql";

interface ThrottlingOptions {
  method: string;
  url: string;
  request: {
    retryCount: number;
  };
}

export function buildGitHubApi(token: string): GitHubApi {
  const octokit: Octokit = new ThrottledOctokit({
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
      onSecondaryRateLimit: (
        retryAfterSeconds: number,
        options: ThrottlingOptions
      ) => {
        console.warn(
          `Secondary Rate Limit detected for request ${options.method} ${options.url}`
        );
        // We can't bank on the `retryCount` because the API calls are made in parallel and we can have
        // hundreds fail, in which case the `retryCount` is the sum based on the event.
        // This may be fixed in a more up-to-date version, I might test that next.
        console.log(`Retrying after ${retryAfterSeconds} seconds!`);
        return true;
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
    loadCommits(pr) {
      return octokit.paginate(
        octokit.pulls.listCommits.endpoint.merge({
          owner: pr.repo.owner,
          repo: pr.repo.name,
          pull_number: pr.number,
        })
      );
    },
    loadPullRequestStatus(pr) {
      const query = gql`
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
      `;

      return graphQLClient.request(query).then((response) => {
        const result = response.repository.pullRequest;
        const reviewDecision = result.reviewDecision;
        const checkStatus =
          result.commits.nodes?.[0]?.commit.statusCheckRollup?.state;
        return {
          reviewDecision,
          checkStatus,
        };
      });
    },
  };
}
