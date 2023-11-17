import { RestEndpointMethodTypes } from "@octokit/rest";
import {
  GitHubApi,
  PullRequestReference,
  PullRequestStatus,
  RepoReference,
} from "../../github-api/api";
import { nonEmptyItems } from "../../helpers";
import {
  Comment,
  PullRequest,
  Review,
  ReviewState,
} from "../../storage/loaded-state";

/**
 * Refreshes the list of pull requests for a list of repositories.
 *
 * This optimizes for the minimum number of API requests to GitHub as
 * brute-forcing would quickly go over API rate limits if the user has several
 * hundred repositories or many pull requests opened.
 */
export async function refreshOpenPullRequests(githubApi: GitHubApi): Promise<PullRequest[]> {
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

  return Promise.all([
    ...reviewRequestedPullRequests.map((pr) =>
      updateCommentsAndReviews(githubApi, pr, true)
    ),
    // Remove PRs that needs revision but have a review requested of you
    ...needsRevisionPullRequests
      .filter(nrpr => !reviewRequestedPullRequests.find(rrpr => nrpr.number === rrpr.number))
      .map((pr) => updateCommentsAndReviews(githubApi, pr)
    ),
    ...myPullRequests.map((pr) => updateCommentsAndReviews(githubApi, pr, true)),
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
    freshPullRequestDetails,
    freshChangeSummary,
    freshReviews,
    freshComments,
    freshReviewComments,
    pullRequestStatus,
  ] = await Promise.all([
    githubApi.loadPullRequestDetails(pr),
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
  ]);

  return pullRequestFromResponse(
    rawPullRequest,
    freshPullRequestDetails,
    freshChangeSummary,
    freshReviews,
    freshComments,
    freshReviewComments,
    isReviewRequested,
    pullRequestStatus
  );
}

function pullRequestFromResponse(
  response: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number],
  details: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"],
  changeSummary: any,
  reviews: Review[],
  comments: Comment[],
  reviewComments: Comment[],
  reviewRequested: boolean,
  status: PullRequestStatus
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
      additions: changeSummary.reduce((total: number, curr: any) => total + curr.additions, 0),
      deletions: changeSummary.reduce((total: number, curr: any) => total + curr.deletions, 0),
    },
    title: response.title,
    draft: response.draft,
    mergeable: details.mergeable || false,
    reviewRequested,
    requestedReviewers: nonEmptyItems(
      details.requested_reviewers?.map((reviewer) => reviewer?.login)
    ),
    requestedTeams: nonEmptyItems(
      details.requested_teams?.map((team) => team?.name)
    ),
    reviews,
    comments: [...comments, ...reviewComments],
    reviewDecision: status.reviewDecision,
    checkStatus: status.checkStatus,
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
