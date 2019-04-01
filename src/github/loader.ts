import Octokit, {
  PullsListResponse,
  PullsListResponseItem
} from "@octokit/rest";
import { loadPullRequests } from "./api/pull-requests";
import { loadRepos } from "./api/repos";
import { loadReviews, Review } from "./api/reviews";
import { loadAuthenticatedUser } from "./api/user";

/**
 * Loads the set of pull requests that the user must review.
 */
export async function loadPullRequestsRequiringReview(
  token: string
): Promise<PullsListResponse> {
  console.log("Loading pull requests...");
  const octokit = new Octokit({
    auth: `token ${token}`
  });
  const currentUserPromise = loadAuthenticatedUser(octokit);
  const allPullRequests = await loadAllPullRequestsAcrossRepos(octokit);
  const currentUser = await currentUserPromise;
  console.log(`User identified as ${currentUser}.`);

  const nonAuthoredPullRequests = allPullRequests.filter(
    pr => pr.user.login !== currentUser.login
  );
  console.log(
    `Found ${
      allPullRequests.length
    } pull request(s) authored by other users across all repos.`
  );

  const [firstReview, anotherReview] = await Promise.all([
    extractPullRequestsRequiringFirstReview(
      currentUser.login,
      nonAuthoredPullRequests
    ),
    extractPullRequestsRequiringAnotherReview(
      octokit,
      currentUser.login,
      nonAuthoredPullRequests
    )
  ]);
  console.log(
    `Found ${firstReview.length} pull request(s) requiring a first review.`
  );
  console.log(
    `Found ${anotherReview.length} pull request(s) requiring another review.`
  );

  return [...new Set(firstReview.concat(anotherReview))];
}

/**
 * Loads all open pull requests across all repositories that the user has access to.
 */
async function loadAllPullRequestsAcrossRepos(octokit: Octokit) {
  const repos = await loadRepos(octokit);
  console.log(`Found ${repos.length} repos.`);
  const pullRequestsPromises = repos.map(repo =>
    loadPullRequests(octokit, repo.owner.login, repo.name, "open")
  );
  return (await Promise.all(pullRequestsPromises)).flat();
}

/**
 * Extracts pull requests that require a first review from the user.
 */
async function extractPullRequestsRequiringFirstReview(
  currentUserLogin: string,
  pullRequests: PullsListResponseItem[]
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
  pullRequests: PullsListResponseItem[]
) {
  const reviewsPerPullRequestIdPromises = pullRequests.map(async pr => {
    const item: [number, Review[]] = [
      pr.id,
      await loadReviews(
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
