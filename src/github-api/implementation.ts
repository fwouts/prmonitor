import { GitHubApi } from "./api";
import { request } from "@octokit/request";

export function buildGitHubApi(token: string): GitHubApi {
  return {
    async loadAuthenticatedUser(): Promise<any> {
      const response = await request(`GET /user`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      return response.data;
    },
    async searchPullRequests(query): Promise<any> {
      const response = await request(`GET /search/issues`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        q: `is:pr ${query}`,
        org: "octokit",
        type: "private",
      });
      return response.data.items;
    },
    async loadPullRequestDetails(pr): Promise<any> {
      const response = await request(`GET /repos/${pr.repo.owner}/${pr.repo.name}/pulls/${pr.number}`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      console.log('deets', response);
      return response.data;
    },
    async loadPullRequestChangeSummary(pr): Promise<any> {
      const response = await request(`GET /repos/${pr.repo.owner}/${pr.repo.name}/pulls/${pr.number}/files`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      return response.data;
    },
    async loadReviews(pr): Promise<any> {
      const response = await request(`GET /repos/${pr.repo.owner}/${pr.repo.name}/pulls/${pr.number}/reviews`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      return response.data;
    },
    async loadComments(pr): Promise<any> {
      const response = await request(`GET /repos/${pr.repo.owner}/${pr.repo.name}/issues/${pr.number}/comments`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      return response.data ?? [];
    },
    async loadReviewComments(pr): Promise<any> {
      const response = await request(`GET /repos/${pr.repo.owner}/${pr.repo.name}/pulls/${pr.number}/comments`, {
        headers: {
          authorization: `Bearer ${token}`,
        },
        org: "octokit",
        type: "private",
      });
      return response.data ?? [];
    },
    async loadPullRequestStatus(pr) {
      const response = await request("POST /graphql", {
        headers: {
          authorization: `Bearer ${token}`,
        },
        query: `query {
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
        }`,
        variables: {
          login: "octokit",
        },
      });

      const pullRequest = response.data.data.repository.pullRequest;
      return {
        reviewDecision: pullRequest.reviewDecision,
        checkStatus: pullRequest.commits.nodes?.[0]?.commit.statusCheckRollup?.state,
      };
    },
  };
}
