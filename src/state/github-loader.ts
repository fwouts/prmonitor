import Octokit from "@octokit/rest";
import { loadRepos } from "../github/api/repos";
import { loadAuthenticatedUser } from "../github/api/user";
import { loadAllComments } from "./loading/comments";
import { refreshOpenPullRequests } from "./loading/pull-requests";
import { loadAllReviews } from "./loading/reviews";
import {
  LastCheck,
  pullRequestFromResponse,
  repoFromResponse
} from "./storage/last-check";

/**
 * Loads the latest data from GitHub, using the previous known state as a reference.
 */
export const githubLoaderSingleton: GitHubLoader = async function load(
  octokit: Octokit,
  lastCheck: LastCheck | null
): Promise<LastCheck> {
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
  lastCheck: LastCheck | null
) => Promise<LastCheck>;
