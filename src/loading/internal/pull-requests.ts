import { PullsGetResponse, PullsListResponseItem } from "@octokit/rest";
import { repoWasPushedAfter } from "../../filtering/repos-pushed-after";
import { GitHubApi, PullRequestReference } from "../../github-api/api";
import {
  Comment,
  Commit,
  LoadedState,
  PullRequest,
  Repo,
  Review
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
      githubApi.loadPullRequests(repo, "open")
    )
  )).flat();

  // Make sure not to do redundant work in the upcoming loop.
  const alreadyLoadedPullRequestNodeIds = new Set(
    openRawPullRequests.map(pr => pr.node_id)
  );

  const availableRepos = new Set<string>();
  for (const repo of freshlyLoadedRepos) {
    availableRepos.add(`${repo.owner}/${repo.name}`);
  }

  // Also update refresh every other known pull request.
  if (lastCheck) {
    const updatedRawPullRequests = await Promise.all(
      lastCheck.openPullRequests
        .filter(
          pr =>
            !alreadyLoadedPullRequestNodeIds.has(pr.nodeId) &&
            availableRepos.has(`${pr.repoOwner}/${pr.repoName}`)
        )
        .map(pr =>
          githubApi.loadSinglePullRequest({
            repo: {
              owner: pr.repoOwner,
              name: pr.repoName
            },
            number: pr.pullRequestNumber
          })
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
      updateCommentsAndReviews(githubApi, pr, mapping)
    )
  );
}

interface KnownPullRequestMapping {
  [nodeId: string]: PullRequest;
}

async function updateCommentsAndReviews(
  githubApi: GitHubApi,
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
      knownPullRequest.comments,
      knownPullRequest.commits || []
    );
  }
  const pr: PullRequestReference = {
    repo: {
      owner: rawPullRequest.base.repo.owner.login,
      name: rawPullRequest.base.repo.name
    },
    number: rawPullRequest.number
  };
  const [freshReviews, freshComments, freshCommits] = await Promise.all([
    githubApi.loadReviews(pr).then(reviews =>
      reviews.map(review => ({
        authorLogin: review.user ? review.user.login : '',
        state: review.state,
        submittedAt: review.submitted_at
      }))
    ),
    githubApi.loadComments(pr).then(comments =>
      comments.map(comment => ({
        authorLogin: comment.user ? comment.user.login : '',
        createdAt: comment.created_at
      }))
    ),
    githubApi.loadCommits(pr).then(commits =>
      commits.map(commit => ({
        authorLogin: commit.author ? commit.author.login : "",
        createdAt: commit.commit.author.date
      }))
    )
  ]);
  return pullRequestFromResponse(
    rawPullRequest,
    freshReviews,
    freshComments,
    freshCommits
  );
}

function pullRequestFromResponse(
  response: PullsGetResponse | PullsListResponseItem,
  reviews: Review[],
  comments: Comment[],
  commits: Commit[]
): PullRequest {
  return {
    nodeId: response.node_id,
    htmlUrl: response.html_url,
    repoOwner: response.base.repo.owner.login,
    repoName: response.base.repo.name,
    pullRequestNumber: response.number,
    updatedAt: response.updated_at,
    author: {
      login: response.user.login,
      avatarUrl: response.user.avatar_url
    },
    title: response.title,
    requestedReviewers: response.requested_reviewers.map(r => r.login),
    reviews,
    comments,
    commits
  };
}
