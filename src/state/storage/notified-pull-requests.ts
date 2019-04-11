import { ChromeApi } from "../../chrome";
import { chromeValueStorageWithDefault } from "../../storage/internal/chrome-value-storage";

/**
 * Storage of the URLs of pull requests that we have already notified the user about.
 *
 * This is used to avoid notifying twice about the same pull request (unless it is no
 * longer in a reviewable state, and then becomes reviewable again).
 */
export const notifiedPullRequestsStorage = (chromeApi: ChromeApi) =>
  chromeValueStorageWithDefault<string[]>(
    chromeApi,
    "lastSeenPullRequests",
    []
  );
