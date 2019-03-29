import Octokit from "@octokit/rest";
import { loadAllPullRequests, PullRequest } from "./load-all-pull-requests";
import { loadAllRepos } from "./load-all-repos";
import { loadAllReviews, Review } from "./load-all-reviews";
import { getCurrentUserLogin } from "./load-user";

/**
 * Loads the set of pull requests that the user must review.
 */
export async function loadPullRequestsRequiringReview(
  token: string
): Promise<Set<PullRequest>> {
  console.log("Loading pull requests...");
  const octokit = new Octokit({
    auth: `token ${token}`
  });
  const currentUserLoginPromise = getCurrentUserLogin(octokit);
  const allPullRequests = await loadAllPullRequestsAcrossRepos(octokit);
  const currentUserLogin = await currentUserLoginPromise;
  console.log(`User identified as ${currentUserLogin}.`);

  const nonAuthoredPullRequests = allPullRequests.filter(
    pr => pr.user.login !== currentUserLogin
  );
  console.log(
    `Found ${
      allPullRequests.length
    } pull request(s) authored by other users across all repos.`
  );

  const [firstReview, anotherReview] = await Promise.all([
    extractPullRequestsRequiringFirstReview(
      currentUserLogin,
      nonAuthoredPullRequests
    ),
    extractPullRequestsRequiringAnotherReview(
      octokit,
      currentUserLogin,
      nonAuthoredPullRequests
    )
  ]);
  console.log(
    `Found ${firstReview.length} pull request(s) requiring a first review.`
  );
  console.log(
    `Found ${anotherReview.length} pull request(s) requiring another review.`
  );

  return new Set(firstReview.concat(anotherReview));
}

/**
 * Loads all open pull requests across all repositories that the user has access to.
 */
async function loadAllPullRequestsAcrossRepos(octokit: Octokit) {
  const repos = await loadAllRepos(octokit);
  console.log(`Found ${repos.length} repos.`);
  const pullRequestsPromises = repos.map(repo =>
    loadAllPullRequests(octokit, repo.owner.login, repo.name, "open")
  );
  // TODO: Use .flat() once Chrome 69+ is widespread.
  return ([] as PullRequest[]).concat(
    ...(await Promise.all(pullRequestsPromises))
  );
}

/**
 * Extracts pull requests that require a first review from the user.
 */
async function extractPullRequestsRequiringFirstReview(
  currentUserLogin: string,
  pullRequests: PullRequest[]
) {
  return pullRequests.filter(
    pr =>
      pr.requested_reviewers.findIndex(r => r.login === currentUserLogin) !== -1
  );
}

/**
 * Extracts pull requests that require another review from the user.
 */
async function extractPullRequestsRequiringAnotherReview(
  octokit: Octokit,
  currentUserLogin: string,
  pullRequests: PullRequest[]
) {
  const reviewsPerPullRequestIdPromises = pullRequests.map(async pr => {
    const item: [number, Review[]] = [
      pr.id,
      await loadAllReviews(
        octokit,
        pr.base.repo.owner.login,
        pr.base.repo.name,
        pr.number
      )
    ];
    return item;
  });
  const reviewsPerPullRequestId = (await Promise.all(
    reviewsPerPullRequestIdPromises
  )).reduce(
    (acc, [pullRequestId, reviews]) => {
      acc[pullRequestId] = reviews;
      return acc;
    },
    {} as {
      [id: number]: Review[];
    }
  );
  return pullRequests.filter(
    pr =>
      userReviewed(currentUserLogin, reviewsPerPullRequestId[pr.id]) &&
      isNewReviewNeeded(
        pr.user.login,
        currentUserLogin,
        reviewsPerPullRequestId[pr.id]
      )
  );
}

/**
 * Returns whether the user wrote at least once review.
 */
function userReviewed(currentUserLogin: string, reviews: Review[]) {
  return reviews.findIndex(r => r.user.login === currentUserLogin) !== -1;
}

/**
 * Returns whether the user, who previously wrote a review, needs to take another look.
 */
function isNewReviewNeeded(
  pullRequestAuthorLogin: string,
  currentUserLogin: string,
  reviews: Review[]
) {
  let lastReviewFromCurrentUser = 0;
  let lastChangeFromAuthor = 0;
  for (const review of reviews) {
    if (review.state === "PENDING") {
      // Ignore pending reviews (we don't want a user to think that they've submitted their
      // review when they didn't yet).
      continue;
    }
    const submittedAt = new Date(review.submitted_at).getTime();
    if (review.user.login === pullRequestAuthorLogin) {
      lastChangeFromAuthor = submittedAt;
    } else if (review.user.login === currentUserLogin) {
      lastReviewFromCurrentUser = submittedAt;
    } else {
      // Comment from someone else. Ignore.
    }
  }
  return lastReviewFromCurrentUser < lastChangeFromAuthor;
}
