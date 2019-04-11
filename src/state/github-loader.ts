import Octokit, {
  IssuesListCommentsResponse,
  PullsGetResponse,
  PullsListResponseItem,
  ReposGetResponse
} from "@octokit/rest";
import { loadRepos } from "../github/api/repos";
import { PullsListReviewsResponse } from "../github/api/reviews";
import { loadAuthenticatedUser } from "../github/api/user";
import { LoadedState, PullRequest, Repo } from "../storage/loaded-state";
import { loadAllComments } from "./loading/comments";
import { refreshOpenPullRequests } from "./loading/pull-requests";
import { loadAllReviews } from "./loading/reviews";

/**
 * Loads the latest data from GitHub, using the previous known state as a reference.
 */
export const githubLoaderSingleton: GitHubLoader = async function load(
  octokit: Octokit,
  lastCheck: LoadedState | null
): Promise<LoadedState> {
  const user = await loadAuthenticatedUser(octokit);
  const repos = await loadRepos(octokit).then(r => r.map(repoFromResponse));
  const openPullRequests = await refreshOpenPullRequests(
    octokit,
    repos,
    lastCheck
  );
  const reviewsPerPullRequest = await loadAllReviews(octokit, openPullRequests);
  const commentsPerPullRequest = await loadAllComments(
    octokit,
    openPullRequests
  );
  return {
    userLogin: user.login,
    openPullRequests: openPullRequests.map(pr =>
      pullRequestFromResponse(
        pr,
        reviewsPerPullRequest[pr.node_id],
        commentsPerPullRequest[pr.node_id]
      )
    ),
    repos
  };
};

export type GitHubLoader = (
  octokit: Octokit,
  lastCheck: LoadedState | null
) => Promise<LoadedState>;

function repoFromResponse(response: ReposGetResponse): Repo {
  return {
    owner: response.owner.login,
    name: response.name,
    pushedAt: response.pushed_at
  };
}

function pullRequestFromResponse(
  response: PullsGetResponse | PullsListResponseItem,
  reviews: PullsListReviewsResponse,
  comments: IssuesListCommentsResponse
): PullRequest {
  return {
    nodeId: response.node_id,
    htmlUrl: response.html_url,
    repoOwner: response.base.repo.owner.login,
    repoName: response.base.repo.name,
    pullRequestNumber: response.number,
    authorLogin: response.user.login,
    author: {
      login: response.user.login,
      avatarUrl: response.user.avatar_url
    },
    updatedAt: response.updated_at,
    title: response.title,
    requestedReviewers: response.requested_reviewers.map(r => r.login),
    reviews: reviews.map(r => ({
      authorLogin: r.user.login,
      state: r.state,
      submittedAt: r.submitted_at
    })),
    comments: comments.map(c => ({
      authorLogin: c.user.login,
      createdAt: c.created_at
    }))
  };
}
