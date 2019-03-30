import { PullRequest } from "../../github/api/pull-requests";
import { storageWithDefault } from "./helper";

/**
 * Storage of the list of unreviewed pull requests.
 */
export const unreviewedPullRequestsStorage = storageWithDefault<PullRequest[]>(
  "unreviewedPullRequests",
  []
);

/**
 * Storage of the URLs of last seen pull requests.
 *
 * This is used to avoid notifying twice about the same pull request.
 */
export const seenPullRequestsUrlsStorage = storageWithDefault<string[]>(
  "lastSeenPullRequests",
  []
);
