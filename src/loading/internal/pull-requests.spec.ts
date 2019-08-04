import {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListCommitsResponse
} from "@octokit/rest";
import {
  GetAuthenticatedUserResponse,
  PullRequestReference,
  PullsListReviewsResponse,
  PullsSearchResponse
} from "../../github-api/api";
import { PullRequest } from "../../storage/loaded-state";
import { refreshOpenPullRequests } from "./pull-requests";

describe("refreshOpenPullRequests", () => {
  it("returns an empty list when there are no PRs", async () => {
    const githubApi = mockGitHubApi();
    githubApi.searchPullRequests.mockReturnValue(Promise.resolve([]));
    const result = await refreshOpenPullRequests(githubApi, "author");
    expect(result).toHaveLength(0);
  });

  it("loads pull requests from all three queries", async () => {
    const githubApi = mockGitHubApi();
    githubApi.searchPullRequests.mockImplementation(async query => {
      if (query.startsWith("author:")) {
        return [
          {
            node_id: "authored",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://authored",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 1,
            title: "authored",
            draft: false,
            user: {
              login: "author",
              avatar_url: "http://avatar"
            }
          }
        ];
      } else if (query.startsWith("commenter:")) {
        return [
          {
            node_id: "commented",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://commented",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 2,
            title: "commented",
            draft: false,
            user: {
              login: "someone",
              avatar_url: "http://avatar"
            }
          }
        ];
      } else if (query.startsWith("review-requested:")) {
        return [
          {
            node_id: "review-requested",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://review-requested",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 3,
            title: "review-requested",
            draft: false,
            user: {
              login: "someone",
              avatar_url: "http://avatar"
            }
          }
        ];
      } else {
        throw new Error(
          `Unknown query: "${query}". Do you need to fix the mock?`
        );
      }
    });
    githubApi.loadPullRequestDetails.mockReturnValue(
      Promise.resolve(({
        requested_reviewers: []
      } as unknown) as PullsGetResponse)
    );
    githubApi.loadComments.mockReturnValue(Promise.resolve([]));
    githubApi.loadReviews.mockReturnValue(Promise.resolve([]));
    githubApi.loadCommits.mockReturnValue(Promise.resolve([]));
    const result = await refreshOpenPullRequests(githubApi, "author");
    expect(result).toHaveLength(3);
    expect(githubApi.searchPullRequests.mock.calls).toEqual([
      [`review-requested:author is:open archived:false`],
      [`commenter:author -review-requested:author is:open archived:false`],
      [
        `author:author -commenter:author -review-requested:author is:open archived:false`
      ]
    ]);
  });
});

function mockGitHubApi() {
  return {
    loadAuthenticatedUser: jest.fn<Promise<GetAuthenticatedUserResponse>, []>(),
    searchPullRequests: jest.fn<Promise<PullsSearchResponse>, [string]>(),
    loadPullRequestDetails: jest.fn<
      Promise<PullsGetResponse>,
      [PullRequestReference]
    >(),
    loadReviews: jest.fn<
      Promise<PullsListReviewsResponse>,
      [PullRequestReference]
    >(),
    loadComments: jest.fn<
      Promise<IssuesListCommentsResponse>,
      [PullRequestReference]
    >(),
    loadCommits: jest.fn<
      Promise<PullsListCommitsResponse>,
      [PullRequestReference]
    >()
  };
}

export function createFakePullRequest(
  repoOwner: string,
  repoName: string,
  pullRequestNumber: number
): PullRequest {
  const id = `${repoOwner}/${repoName}/${pullRequestNumber}`;
  return {
    nodeId: id,
    title: id,
    updatedAt: "5 May 2019",
    repoOwner,
    repoName,
    pullRequestNumber,
    author: {
      login: "author",
      avatarUrl: "http://url"
    },
    htmlUrl: "http://url",
    reviewRequested: false,
    reviews: [],
    comments: [],
    commits: []
  };
}
