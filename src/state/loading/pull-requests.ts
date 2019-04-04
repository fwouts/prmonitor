import Octokit, {
  PullsGetResponse,
  PullsListResponseItem
} from "@octokit/rest";
import {
  loadPullRequest,
  loadPullRequests
} from "../../github/api/pull-requests";
import { repoWasPushedAfter } from "../filtering/repos-pushed-after";
import { PullRequest, Repo } from "../storage/last-check";

/**
 * Refreshes the list of pull requests for a list of repositories.
 *
 * This optimizes for the minimum number of API requests to GitHub as
 * brute-forcing would quickly go over API rate limits if the user has several
 * hundred repositories or many pull requests opened.
 */
export async function refreshOpenPullRequests(
  octokit: Octokit,
  repos: Repo[],
  previouslyOpenPullRequests: PullRequest[] | null
): Promise<Array<PullsListResponseItem | PullsGetResponse>> {
  const maximumPushedAt = repos.length > 0 ? repos[0].pushedAt : null;

  // Look for new pull requests in repos that have been recently pushed.
  const reposWithPotentiallyNewPullRequests = repos.filter(
    repoWasPushedAfter(maximumPushedAt)
  );

  // For each recently pushed repo, load all open pull requests.
  const openPullRequests: Array<
    PullsListResponseItem | PullsGetResponse
  > = (await Promise.all(
    reposWithPotentiallyNewPullRequests.map(repo =>
      loadPullRequests(octokit, repo.owner, repo.name, "open")
    )
  )).flat();

  // Make sure not to do redundant work in the upcoming loop.
  const alreadyLoadedPullRequestNodeIds = new Set(
    openPullRequests.map(pr => pr.node_id)
  );

  // Also update the status of every other known pull request.
  if (previouslyOpenPullRequests) {
    const updatedPullRequests = await Promise.all(
      previouslyOpenPullRequests
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
    openPullRequests.push(
      ...updatedPullRequests.filter(pr => pr.state === "open")
    );
  }

  return openPullRequests;
}
