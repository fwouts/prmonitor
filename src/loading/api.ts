import { LoadedState } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";

/**
 * Loads the latest data from GitHub, using the previous known state as a reference.
 */
export type GitHubLoader = (
  token: string,
  configuration: MuteConfiguration,
  lastCheck: LoadedState | null
) => Promise<LoadedState>;
