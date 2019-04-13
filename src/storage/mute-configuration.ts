export const NOTHING_MUTED: MuteConfiguration = {
  mutedPullRequests: []
};

export interface MuteConfiguration {
  // Note: it's expected that a specific pull request only occurs once in the
  // list.
  //
  // We could have used a dictionary keyed by owner/name/number instead, but
  // hey, this was hacked up too quickly and now it's persisted in people's
  // local storage so let's leave it for now until there's a pressing need for a
  // breaking change (we could do a smooth transition with a bit of effort).
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
