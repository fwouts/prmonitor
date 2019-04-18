import { LoadedState } from "../storage/loaded-state";

/**
 * Loads the latest data from GitHub, using the previous known state as a reference.
 */
export type GitHubLoader = (
  token: string,
  lastCheck: LoadedState | null
) => Promise<LoadedState>;
