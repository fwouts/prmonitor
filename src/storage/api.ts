import { LoadedState } from "../storage/loaded-state";

export interface Store {
  /**
   * Storage of the last error seen when fetching GitHub data.
   */
  lastError: ValueStorage<string | null>;

  /**
   * Storage of the last information we loaded about pull requests.
   */
  lastCheck: ValueStorage<LoadedState | null>;

  /**
   * Storage of whether a refresh is happening in the background.
   */
  currentlyRefreshing: ValueStorage<boolean>;

  /**
   * Storage of the URLs of pull requests that we have already notified the user about.
   *
   * This is used to avoid notifying twice about the same pull request (unless it is no
   * longer in a reviewable state, and then becomes reviewable again).
   */
  notifiedPullRequests: ValueStorage<string[]>;

  /**
   * Storage of the user's provided GitHub token.
   */
  token: ValueStorage<string | null>;
}

export interface ValueStorage<T> {
  load(): Promise<T>;
  save(value: T | null): Promise<void>;
}
