import { components } from "@octokit/openapi-types";
import { GitHubApi } from "../../github-api/api";
import { mocked } from "../../testing/mocked";
import { refreshOpenPullRequests } from "./pull-requests";

describe("refreshOpenPullRequests", () => {
  it("returns an empty list when there are no PRs", async () => {
    const githubApi = mockGitHubApi();
    mocked(githubApi.searchPullRequests).mockReturnValue(Promise.resolve([]));
    const result = await refreshOpenPullRequests(githubApi, "author");
    expect(result).toHaveLength(0);
  });

  it("loads pull requests from all three queries", async () => {
    const githubApi = mockGitHubApi();
    mocked(githubApi.searchPullRequests).mockImplementation(async (query) => {
      const defaultResponse =
        {} as components["schemas"]["issue-search-result-item"];
      if (query.startsWith("author:")) {
        return [
          {
            ...defaultResponse,
            node_id: "authored",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://authored",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 1,
            title: "authored",
            draft: false,
            user: {
              ...defaultResponse.user!,
              login: "author",
              avatar_url: "http://avatar",
            },
          },
        ];
      } else if (query.startsWith("commenter:")) {
        return [
          {
            ...defaultResponse,
            node_id: "commented",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://commented",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 2,
            title: "commented",
            draft: false,
            user: {
              ...defaultResponse.user!,
              login: "someone",
              avatar_url: "http://avatar",
            },
          },
        ];
      } else if (query.startsWith("review-requested:")) {
        return [
          {
            ...defaultResponse,
            node_id: "review-requested",
            created_at: "16 May 2019",
            updated_at: "16 May 2019",
            html_url: "http://review-requested",
            repository_url: "https://github.com/zenclabs/prmonitor",
            number: 3,
            title: "review-requested",
            draft: false,
            user: {
              ...defaultResponse.user!,
              login: "someone",
              avatar_url: "http://avatar",
            },
          },
        ];
      } else {
        throw new Error(
          `Unknown query: "${query}". Do you need to fix the mock?`
        );
      }
    });
    mocked(githubApi.loadPullRequestDetails).mockReturnValue(
      Promise.resolve({
        requested_reviewers: [],
        requested_teams: [],
      } as any)
    );
    mocked(githubApi.loadComments).mockReturnValue(Promise.resolve([]));
    mocked(githubApi.loadReviews).mockReturnValue(Promise.resolve([]));
    mocked(githubApi.loadCommits).mockReturnValue(Promise.resolve([]));
    const result = await refreshOpenPullRequests(githubApi, "fwouts");
    expect(result).toHaveLength(3);
    expect(mocked(githubApi.searchPullRequests).mock.calls).toEqual([
      [`review-requested:fwouts -author:fwouts is:open archived:false`],
      [
        `commenter:fwouts -author:fwouts -review-requested:fwouts is:open archived:false`,
      ],
      [`author:fwouts is:open archived:false`],
    ]);
  });
});

function mockGitHubApi(): GitHubApi {
  return {
    loadAuthenticatedUser: jest.fn(),
    searchPullRequests: jest.fn(),
    loadPullRequestDetails: jest.fn(),
    loadReviews: jest.fn(),
    loadComments: jest.fn(),
    loadCommits: jest.fn(),
  };
}
