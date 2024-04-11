import { RestEndpointMethodTypes } from "@octokit/rest";
import {
  GitHubApi,
  PullRequestReference,
  PullRequestStatus,
  RepoReference,
} from "../../github-api/api";
import {
  Comment,
  PullRequest,
  Review,
  ReviewState,
} from "../../storage/loaded-state";
import moment from "moment";

export function testPRs(): Promise<PullRequest[]> {
  return Promise.all([
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1098,
      updatedAt: "9 December 2023",
      author: {
        login: "dbharris2",
        avatarUrl:
          "https://cdn.iconscout.com/icon/free/png-256/free-eevee-eievui-pokemon-cartoon-game-video-pokemongo-32216.png",
      },
      changeSummary: {
        changedFiles: 6,
        additions: 134,
        deletions: 344,
      },
      title: "Codemod old API to new API",
      draft: false,
      reviewRequested: true,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [
        {
          authorLogin: "someone-else",
          state: "APPROVED",
          submittedAt: "10 December 2023",
        },
      ],
      comments: [
        { authorLogin: "", createdAt: "" },
        { authorLogin: "", createdAt: "" },
      ],
      reviewDecision: "APPROVED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1234,
      updatedAt: "10 December 2023",
      author: {
        login: "dbharris2",
        avatarUrl:
          "https://cdn.iconscout.com/icon/free/png-256/free-eevee-eievui-pokemon-cartoon-game-video-pokemongo-32216.png",
      },
      changeSummary: {
        changedFiles: 27,
        additions: 732,
        deletions: 640,
      },
      title: "Use new endpoint on homepage",
      draft: false,
      reviewRequested: true,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [],
      comments: [
        { authorLogin: "", createdAt: "" },
        { authorLogin: "", createdAt: "" },
      ],
      reviewDecision: "REVIEW_REQUIRED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1308,
      updatedAt: "10 December 2023",
      author: {
        login: "dbharris2",
        avatarUrl:
          "https://cdn.iconscout.com/icon/free/png-256/free-eevee-eievui-pokemon-cartoon-game-video-pokemongo-32216.png",
      },
      changeSummary: {
        changedFiles: 27,
        additions: 732,
        deletions: 640,
      },
      title: "Use new routing API",
      draft: false,
      reviewRequested: false,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [{ authorLogin: "dbharris2", state: "CHANGES_REQUESTED" }],
      comments: [
        { authorLogin: "", createdAt: "" },
        { authorLogin: "", createdAt: "" },
      ],
      reviewDecision: "CHANGES_REQUESTED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1023,
      updatedAt: "8 December 2023",
      author: {
        login: "dbharris2",
        avatarUrl:
          "https://cdn.iconscout.com/icon/free/png-256/free-eevee-eievui-pokemon-cartoon-game-video-pokemongo-32216.png",
      },
      changeSummary: {
        changedFiles: 4,
        additions: 12,
        deletions: 64,
      },
      title: "Update unit tests for nav bar",
      draft: true,
      reviewRequested: true,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [],
      comments: [
        { authorLogin: "", createdAt: "" },
        { authorLogin: "", createdAt: "" },
      ],
      reviewDecision: "REVIEW_REQUIRED",
      checkStatus: "FAILURE",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1521,
      updatedAt: "10 December 2023",
      author: {
        login: "someone-else",
        avatarUrl:
          "https://daily.pokecommunity.com/wp-content/uploads/2018/11/pokemon_icon_092_00.png",
      },
      changeSummary: {
        changedFiles: 7,
        additions: 112,
        deletions: 32,
      },
      title: "Ship new accounts page",
      draft: false,
      reviewRequested: true,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [{ authorLogin: "dbharris2", state: "CHANGES_REQUESTED" }],
      comments: [{ authorLogin: "dbharris2", createdAt: "10 December 2023" }],
      reviewDecision: "REVIEW_REQUIRED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1521,
      updatedAt: "9 December 2023",
      author: {
        login: "someone-else",
        avatarUrl:
          "https://daily.pokecommunity.com/wp-content/uploads/2018/11/pokemon_icon_092_00.png",
      },
      changeSummary: {
        changedFiles: 7,
        additions: 112,
        deletions: 32,
      },
      title: "Fix bug when scrolling through accounts",
      draft: false,
      reviewRequested: true,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [],
      comments: [
        { authorLogin: "", createdAt: "" },
        { authorLogin: "", createdAt: "" },
      ],
      reviewDecision: "REVIEW_REQUIRED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
    {
      nodeId: "123",
      htmlUrl: "",
      repoOwner: "dbharris",
      repoName: "test-repo",
      pullRequestNumber: 1771,
      updatedAt: "9 December 2023",
      author: {
        login: "another-someone",
        avatarUrl: "https://www.icons101.com/icon_ico/id_60018/025_Pikachu.ico",
      },
      changeSummary: {
        changedFiles: 4,
        additions: 12,
        deletions: 64,
      },
      title: "Add caching to queries",
      draft: false,
      reviewRequested: false,
      requestedReviewers: [],
      requestedTeams: [],
      reviews: [{ authorLogin: "dbharris2", state: "CHANGES_REQUESTED" }],
      comments: [{ authorLogin: "dbharris2", createdAt: "10 December 2023" }],
      reviewDecision: "CHANGES_REQUESTED",
      checkStatus: "SUCCESS",
      isMerged: false,
    },
  ]);
}

/**
 * Refreshes the list of pull requests for a list of repositories.
 *
 * This optimizes for the minimum number of API requests to GitHub as
 * brute-forcing would quickly go over API rate limits if the user has several
 * hundred repositories or many pull requests opened.
 */
export async function refreshOpenPullRequests(
  githubApi: GitHubApi
): Promise<PullRequest[]> {
  // if (true) {
  //   return testPRs();
  // }

  // As long as a review is requested for you (even if changes have been requested), then it's reviewable
  const reviewRequestedPullRequests = await githubApi.searchPullRequests(
    `-author:@me -is:draft is:open -review:approved review-requested:@me`
  );
  const needsRevisionPullRequests = await githubApi.searchPullRequests(
    `-author:@me -is:draft is:open review:changes_requested involves:@me`
  );
  const myPullRequests = await githubApi.searchPullRequests(
    `author:@me is:open`
  );
  const myRecentlyMergedPullRequests = await githubApi.searchPullRequests(
    `author:@me is:closed archived:false`
  );

  return Promise.all([
    ...reviewRequestedPullRequests.map((pr) =>
      updateCommentsAndReviews(githubApi, pr, true)
    ),
    // Remove PRs that needs revision but have a review requested of you
    ...needsRevisionPullRequests
      .filter(
        (nrpr) =>
          !reviewRequestedPullRequests.find(
            (rrpr) => nrpr.number === rrpr.number
          )
      )
      .map((pr) => updateCommentsAndReviews(githubApi, pr)),
    ...myPullRequests.map((pr) =>
      updateCommentsAndReviews(githubApi, pr, true)
    ),
    ...myRecentlyMergedPullRequests
      .filter((pr) => moment().diff(moment(pr.updated_at), "days") < 1)
      .map((pr) => updateCommentsAndReviews(githubApi, pr)),
  ]);
}

async function updateCommentsAndReviews(
  githubApi: GitHubApi,
  rawPullRequest: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number],
  isReviewRequested = false
): Promise<PullRequest> {
  const repo = extractRepo(rawPullRequest);
  const pr: PullRequestReference = {
    repo,
    number: rawPullRequest.number,
  };
  const [
    freshChangeSummary,
    freshReviews,
    freshComments,
    freshReviewComments,
    pullRequestStatus,
    isMerged,
  ] = await Promise.all([
    githubApi.loadPullRequestChangeSummary(pr),
    githubApi.loadReviews(pr).then((reviews) =>
      reviews.map((review) => ({
        authorLogin: review.user ? review.user.login : "",
        state: review.state as ReviewState,
        submittedAt: review.submitted_at,
      }))
    ),
    githubApi.loadComments(pr).then((comments) =>
      comments.map((comment) => ({
        authorLogin: comment.user ? comment.user.login : "",
        createdAt: comment.created_at,
      }))
    ),
    githubApi.loadReviewComments(pr).then((comments) =>
      comments.map((comment) => ({
        authorLogin: comment.user ? comment.user.login : "",
        createdAt: comment.created_at,
      }))
    ),
    githubApi.loadPullRequestStatus(pr),
    githubApi.loadIsMerged(pr),
  ]);

  return pullRequestFromResponse(
    rawPullRequest,
    freshChangeSummary,
    freshReviews,
    freshComments,
    freshReviewComments,
    isReviewRequested,
    pullRequestStatus,
    isMerged
  );
}

function pullRequestFromResponse(
  response: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number],
  changeSummary: any,
  reviews: Review[],
  comments: Comment[],
  reviewComments: Comment[],
  reviewRequested: boolean,
  status: PullRequestStatus,
  isMerged: boolean
): PullRequest {
  const repo = extractRepo(response);
  return {
    nodeId: response.node_id,
    htmlUrl: response.html_url,
    repoOwner: repo.owner,
    repoName: repo.name,
    pullRequestNumber: response.number,
    updatedAt: response.updated_at,
    author: response.user && {
      login: response.user.login,
      avatarUrl: response.user.avatar_url,
    },
    changeSummary: {
      changedFiles: changeSummary.length,
      additions: changeSummary.reduce(
        (total: number, curr: any) => total + curr.additions,
        0
      ),
      deletions: changeSummary.reduce(
        (total: number, curr: any) => total + curr.deletions,
        0
      ),
    },
    title: response.title,
    draft: response.draft,
    reviewRequested,
    reviews,
    comments: [...comments, ...reviewComments],
    reviewDecision: status.reviewDecision,
    checkStatus: status.checkStatus,
    isMerged,
  };
}

function extractRepo(
  response: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number]
): RepoReference {
  const urlParts = response.repository_url.split("/");
  if (urlParts.length < 2) {
    throw new Error(`Unexpected repository_url: ${response.repository_url}`);
  }
  return {
    owner: urlParts[urlParts.length - 2],
    name: urlParts[urlParts.length - 1],
  };
}
