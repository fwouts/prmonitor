export interface Badger {
  update(state: BadgeState): void;
}

export type BadgeState =
  | {
      kind: "initializing";
    }
  | {
      kind: "loaded";
      unreviewedPullRequestCount: number;
      approvedOwnPullRequestCount: number;
    }
  | {
      kind: "reloading";
      unreviewedPullRequestCount: number;
      approvedOwnPullRequestCount: number;
    }
  | {
      kind: "error";
    };
