import { storageWithDefault } from "./helper";

export const NOTHING_MUTED: MuteConfiguration = {
  mutedPullRequests: []
};

export const muteConfigurationStorage = storageWithDefault(
  "mute",
  NOTHING_MUTED
);

export interface MuteConfiguration {
  mutedPullRequests: MutedPullRequest[];
}

export interface MutedPullRequest {
  repo: {
    owner: string;
    name: string;
  };
  number: number;
  until: MutedUntil;
}

// TODO: Add other types of muting (e.g. forever).
export type MutedUntil = MutedUntilNextUpdate;

export interface MutedUntilNextUpdate {
  kind: "next-update";

  /**
   * The timestamp at which the PR was muted.
   *
   * Any update by the author after this timestamp will make the PR re-appear.
   */
  mutedAtTimestamp: number;
}
