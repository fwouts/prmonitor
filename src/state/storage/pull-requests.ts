import { chromeApi } from "../../chrome";
import { PullRequest } from "../../github/api/pull-requests";

/**
 * Saves the list of unreviewed pull requests.
 */
export async function saveUnreviewedPullRequestsToStorage(
  unreviewedPullRequests: PullRequest[]
) {
  await new Promise(resolve => {
    chromeApi.storage.local.set(
      {
        unreviewedPullRequests
      },
      resolve
    );
  });
}

export async function loadUnreviewedPullRequestsFromStorage(): Promise<
  PullRequest[]
> {
  return new Promise<PullRequest[]>(resolve =>
    chromeApi.storage.local.get(["unreviewedPullRequests"], result =>
      resolve(result.unreviewedPullRequests || [])
    )
  );
}

/**
 * Records the pull requests we saw this time, so that we don't show a notification
 * next time.
 */
export async function saveSeenPullRequestsToStorage(
  pullRequestUrls: Set<string>
) {
  chromeApi.storage.local.set({
    lastSeenPullRequests: Array.from(pullRequestUrls)
  });
}

/**
 * Returns a list of pull request URLs that required attention last time we checked.
 */
export function loadLastSeenPullRequestsUrlsFromStorage(): Promise<
  Set<string>
> {
  return new Promise<Set<string>>(resolve => {
    chromeApi.storage.local.get(["lastSeenPullRequests"], result => {
      resolve(new Set(result.lastSeenPullRequests || []));
    });
  });
}
