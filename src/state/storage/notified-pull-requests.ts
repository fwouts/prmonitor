import { storageWithDefault } from "./helper";

/**
 * Storage of the URLs of pull requests that we have already notified the user about.
 *
 * This is used to avoid notifying twice about the same pull request (unless it is no
 * longer in a reviewable state, and then becomes reviewable again).
 */
export const notifiedPullRequestsStorage = storageWithDefault<string[]>(
  "lastSeenPullRequests",
  []
);
