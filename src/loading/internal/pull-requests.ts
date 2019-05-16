import {
  GitHubApi,
  PullRequestReference,
  PullsSearchResponseItem,
  RepoReference
} from "../../github-api/api";
import {
  Comment,
  Commit,
  LoadedState,
  PullRequest,
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
  userLogin: string,
  lastCheck: LoadedState | null
): Promise<PullRequest[]> {
  // Note: each query should specifically exclude the previous ones so we don't end up having
  // to deduplicate PRs across lists.
  const reviewRequestedPullRequests = await githubApi.searchPullRequests(
    `review-requested:${userLogin} is:open archived:false`
  );
  const commentedPullRequests = await githubApi.searchPullRequests(
    `commenter:${userLogin} -review-requested:${userLogin} is:open archived:false`
  );
  const ownPullRequests = await githubApi.searchPullRequests(
    `author:${userLogin} -commenter:${userLogin} -review-requested:${userLogin} is:open archived:false`
  );
  const mapping: KnownPullRequestMapping = {};
  for (const oldPr of lastCheck ? lastCheck.openPullRequests : []) {
    mapping[oldPr.nodeId] = oldPr;
  }
  return Promise.all([
    ...reviewRequestedPullRequests.map(pr =>
      updateCommentsAndReviews(githubApi, pr, mapping, true)
    ),
    ...commentedPullRequests.map(pr =>
      updateCommentsAndReviews(githubApi, pr, mapping)
    ),
    ...ownPullRequests.map(pr =>
      updateCommentsAndReviews(githubApi, pr, mapping)
    )
  ]);
}

interface KnownPullRequestMapping {
  [nodeId: string]: PullRequest;
}

async function updateCommentsAndReviews(
  githubApi: GitHubApi,
  rawPullRequest: PullsSearchResponseItem,
  mapping: KnownPullRequestMapping,
  isReviewRequested = false
): Promise<PullRequest> {
  const knownPullRequest = mapping[rawPullRequest.node_id];
  // Only reload comments, reviews and commits if the PR has been updated or it's a new one.
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
      knownPullRequest.commits || [],
      isReviewRequested
    );
  }
  const repo = extractRepo(rawPullRequest);
  const pr: PullRequestReference = {
    repo,
    number: rawPullRequest.number
  };
  const [freshReviews, freshComments, freshCommits] = await Promise.all([
    githubApi.loadReviews(pr).then(reviews =>
      reviews.map(review => ({
        authorLogin: review.user.login,
        state: review.state,
        submittedAt: review.submitted_at
      }))
    ),
    githubApi.loadComments(pr).then(comments =>
      comments.map(comment => ({
        authorLogin: comment.user.login,
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
    freshCommits,
    isReviewRequested
  );
}

function pullRequestFromResponse(
  response: PullsSearchResponseItem,
  reviews: Review[],
  comments: Comment[],
  commits: Commit[],
  reviewRequested: boolean
): PullRequest {
  const repo = extractRepo(response);
  return {
    nodeId: response.node_id,
    htmlUrl: response.html_url,
    repoOwner: repo.owner,
    repoName: repo.name,
    pullRequestNumber: response.number,
    updatedAt: response.updated_at,
    author: {
      login: response.user.login,
      avatarUrl: response.user.avatar_url
    },
    title: response.title,
    reviewRequested,
    reviews,
    comments,
    commits
  };
}

function extractRepo(response: PullsSearchResponseItem): RepoReference {
  const urlParts = response.repository_url.split("/");
  if (urlParts.length < 2) {
    throw new Error(`Unexpected repository_url: ${response.repository_url}`);
  }
  return {
    owner: urlParts[urlParts.length - 2],
    name: urlParts[urlParts.length - 1]
  };
}
