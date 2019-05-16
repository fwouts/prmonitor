import {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListCommitsResponse,
  PullsListResponse
} from "@octokit/rest";
import {
  GetAuthenticatedUserResponse,
  PullRequestReference,
  PullsListReviewsResponse,
  PullsSearchResponse,
  RepoReference,
  ReposListResponse
} from "../../github-api/api";
import { PullRequest } from "../../storage/loaded-state";
import { RecursivePartial } from "../../testing/recursive-partial";
import { refreshOpenPullRequests } from "./pull-requests";

describe("refreshOpenPullRequests", () => {
  it("returns an empty list when there are no repos", async () => {
    const githubApi = mockGitHubApi();
    const result = await refreshOpenPullRequests(githubApi, "author", null);
    expect(result).toHaveLength(0);
  });

  it("refreshes all known pull requests", async () => {
    const githubApi = mockGitHubApi();
    githubApi.loadSinglePullRequest.mockReturnValue(
      Promise.resolve(
        createFakeSinglePullRequestResponse("zenclabs", "prmonitor", 1)
      )
    );
    githubApi.loadComments.mockReturnValue(Promise.resolve([]));
    githubApi.loadReviews.mockReturnValue(Promise.resolve([]));
    githubApi.loadCommits.mockReturnValue(Promise.resolve([]));
    const result = await refreshOpenPullRequests(githubApi, "author", {
      userLogin: "author",
      openPullRequests: [createFakePullRequest("zenclabs", "prmonitor", 1)]
    });
    expect(result).toHaveLength(1);
    expect(githubApi.loadSinglePullRequest).toHaveBeenCalledWith({
      repo: {
        owner: "zenclabs",
        name: "prmonitor"
      },
      number: 1
    });
  });

  it("removes pull requests from removed repos", async () => {
    const githubApi = mockGitHubApi();
    const result = await refreshOpenPullRequests(githubApi, "author", {
      userLogin: "author",
      openPullRequests: [createFakePullRequest("zenclabs", "prmonitor", 1)]
    });
    expect(result).toHaveLength(0);
    expect(githubApi.loadSinglePullRequest).not.toHaveBeenCalled();
  });
});

function mockGitHubApi() {
  return {
    loadAuthenticatedUser: jest.fn<Promise<GetAuthenticatedUserResponse>, []>(),
    loadRepos: jest.fn<Promise<ReposListResponse>, []>(),
    loadPullRequests: jest.fn<
      Promise<PullsListResponse>,
      [RepoReference, "open" | "closed" | "all"]
    >(),
    loadSinglePullRequest: jest.fn<
      Promise<PullsGetResponse>,
      [PullRequestReference]
    >(),
    searchPullRequests: jest.fn<Promise<PullsSearchResponse>, [string]>(),
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
    requestedReviewers: [],
    reviews: [],
    comments: [],
    commits: []
  };
}

export function createFakeSinglePullRequestResponse(
  repoOwner: string,
  repoName: string,
  pullRequestNumber: number,
  state = "open"
): PullsGetResponse {
  const partial: RecursivePartial<PullsGetResponse> = {
    base: {
      repo: {
        owner: {
          login: repoOwner
        },
        name: repoName
      }
    },
    number: pullRequestNumber,
    state,
    user: {
      login: "author"
    },
    requested_reviewers: []
  };
  return partial as PullsGetResponse;
}
