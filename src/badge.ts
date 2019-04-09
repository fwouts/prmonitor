import { chromeApi } from "./chrome";

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

export function updateBadge(state: BadgeState) {
  chromeApi.browserAction.setBadgeText({
    text: badgeLabel(state)
  });
  chromeApi.browserAction.setBadgeBackgroundColor({
    color: badgeColor(state)
  });
}

function badgeLabel(state: BadgeState): string {
  switch (state.kind) {
    case "initializing":
      return "⟳";
    case "loaded":
    case "reloading":
      return `${state.unreviewedPullRequestCount}`;
    case "error":
      return "!";
  }
}

function badgeColor(state: BadgeState): string {
  switch (state.kind) {
    case "initializing":
      return "#48f";
    case "loaded":
    case "reloading":
      return state.unreviewedPullRequestCount === 0 ? "#4d4" : "#f00";
    case "error":
      return "#000";
  }
}
