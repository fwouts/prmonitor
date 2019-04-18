import Octokit, {
  PullsGetResponse,
  PullsListResponseItem
} from "@octokit/rest";
import { repoWasPushedAfter } from "../../filtering/repos-pushed-after";
import {
  Comment,
  LoadedState,
  PullRequest,
  Repo,
  Review
} from "../../storage/loaded-state";
import { loadAllComments } from "./comments";
import { loadPullRequest, loadPullRequests } from "./github-api/pull-requests";
import { loadAllReviews } from "./reviews";

/**
 * Refreshes the list of pull requests for a list of repositories.
 *
 * This optimizes for the minimum number of API requests to GitHub as
 * brute-forcing would quickly go over API rate limits if the user has several
 * hundred repositories or many pull requests opened.
 */
export async function refreshOpenPullRequests(
  octokit: Octokit,
  freshlyLoadedRepos: Repo[],
  lastCheck: LoadedState | null
): Promise<PullRequest[]> {
  const maximumPushedAt =
    lastCheck && lastCheck.repos.length > 0
      ? lastCheck.repos[0].pushedAt
      : null;

  // Look for new pull requests in repos that have been recently pushed.
  const reposWithPotentiallyNewPullRequests = freshlyLoadedRepos.filter(
    repoWasPushedAfter(maximumPushedAt)
  );

  // For each recently pushed repo, load all open pull requests.
  const openRawPullRequests: Array<
    PullsListResponseItem | PullsGetResponse
  > = (await Promise.all(
    reposWithPotentiallyNewPullRequests.map(repo =>
      loadPullRequests(octokit, repo.owner, repo.name, "open")
    )
  )).flat();

  // Make sure not to do redundant work in the upcoming loop.
  const alreadyLoadedPullRequestNodeIds = new Set(
    openRawPullRequests.map(pr => pr.node_id)
  );

  // Also update refresh every other known pull request.
  if (lastCheck) {
    const updatedRawPullRequests = await Promise.all(
      lastCheck.openPullRequests
        .filter(pr => !alreadyLoadedPullRequestNodeIds.has(pr.nodeId))
        .map(pr =>
          loadPullRequest(
            octokit,
            pr.repoOwner,
            pr.repoName,
            pr.pullRequestNumber
          )
        )
    );
    openRawPullRequests.push(
      ...updatedRawPullRequests.filter(pr => pr.state === "open")
    );
  }

  const mapping: KnownPullRequestMapping = {};
  for (const oldPr of lastCheck ? lastCheck.openPullRequests : []) {
    mapping[oldPr.nodeId] = oldPr;
  }
  return Promise.all(
    openRawPullRequests.map(pr =>
      updateCommentsAndReviews(octokit, pr, mapping)
    )
  );
}

interface KnownPullRequestMapping {
  [nodeId: string]: PullRequest;
}

async function updateCommentsAndReviews(
  octokit: Octokit,
  rawPullRequest: PullsListResponseItem | PullsGetResponse,
  mapping: KnownPullRequestMapping
): Promise<PullRequest> {
  const knownPullRequest = mapping[rawPullRequest.node_id];
  // Only reload comments and reviews if the PR has been updated or it's a new one.
  if (
    knownPullRequest &&
    knownPullRequest.updatedAt &&
    new Date(knownPullRequest.updatedAt).getTime() ===
      new Date(rawPullRequest.updated_at).getTime()
  ) {
    return pullRequestFromResponse(
      rawPullRequest,
      knownPullRequest.reviews,
      knownPullRequest.comments
    );
  }
  const pullRequestSummary = {
    repoOwner: rawPullRequest.base.repo.owner.login,
    repoName: rawPullRequest.base.repo.name,
    pullRequestNumber: rawPullRequest.number
  };
  const [freshReviews, freshComments] = await Promise.all([
    loadAllReviews(octokit, pullRequestSummary),
    loadAllComments(octokit, pullRequestSummary)
  ]);
  return pullRequestFromResponse(rawPullRequest, freshReviews, freshComments);
}

function pullRequestFromResponse(
  response: PullsGetResponse | PullsListResponseItem,
  reviews: Review[],
  comments?: Comment[]
): PullRequest {
  return {
    nodeId: response.node_id,
    htmlUrl: response.html_url,
    repoOwner: response.base.repo.owner.login,
    repoName: response.base.repo.name,
    pullRequestNumber: response.number,
    updatedAt: response.updated_at,
    authorLogin: response.user.login,
    author: {
      login: response.user.login,
      avatarUrl: response.user.avatar_url
    },
    title: response.title,
    requestedReviewers: response.requested_reviewers.map(r => r.login),
    reviews,
    comments
  };
}
