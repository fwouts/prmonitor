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
  Commit,
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
export async function refreshOpenPullRequests(
  githubApi: GitHubApi,
  userLogin: string
): Promise<PullRequest[]> {
  // Note: each query should specifically exclude the previous ones so we don't end up having
  // to deduplicate PRs across lists.
  const reviewRequestedPullRequests = await githubApi.searchPullRequests(
    `review-requested:${userLogin} -author:${userLogin} is:open archived:false`
  );
  const commentedPullRequests = await githubApi.searchPullRequests(
    `commenter:${userLogin} -author:${userLogin} -review-requested:${userLogin} is:open archived:false`
  );
  const ownPullRequests = await githubApi.searchPullRequests(
    `author:${userLogin} is:open archived:false`
  );
  return Promise.all([
    ...reviewRequestedPullRequests.map((pr) =>
      updateCommentsAndReviews(githubApi, pr, true)
    ),
    ...commentedPullRequests.map((pr) =>
      updateCommentsAndReviews(githubApi, pr)
    ),
    ...ownPullRequests.map((pr) => updateCommentsAndReviews(githubApi, pr)),
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
    freshReviews,
    freshComments,
    freshCommits,
    pullRequestStatus,
  ] = await Promise.all([
    githubApi.loadPullRequestDetails(pr),
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
    githubApi.loadCommits(pr).then((commits) =>
      commits.map((commit) => ({
        authorLogin: commit.author ? commit.author.login : "",
        createdAt: commit.commit.author?.date,
      }))
    ),
    githubApi.loadPullRequestStatus(pr),
  ]);

  return pullRequestFromResponse(
    rawPullRequest,
    freshPullRequestDetails,
    freshReviews,
    freshComments,
    freshCommits,
    isReviewRequested,
    pullRequestStatus
  );
}

function pullRequestFromResponse(
  response: RestEndpointMethodTypes["search"]["issuesAndPullRequests"]["response"]["data"]["items"][number],
  details: RestEndpointMethodTypes["pulls"]["get"]["response"]["data"],
  reviews: Review[],
  comments: Comment[],
  commits: Commit[],
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
      changedFiles: details.changed_files,
      additions: details.additions,
      deletions: details.deletions,
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
    comments,
    commits,
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
