export interface Badger {
  update(state: BadgeState): void
}

export type BadgeState =
  | {
      kind: "initializing";
    }
  | {
      kind: "loaded";
      unreviewedPullRequestCount: number;
    }
  | {
      kind: "reloading";
      unreviewedPullRequestCount: number;
    }
  | {
      kind: "error";
    };
