import { ChromeApi } from "../chrome/api";
import { Badger, BadgeState } from "./api";

export function buildBadger(chromeApi: ChromeApi): Badger {
  return {
    update(state) {
      updateBadge(chromeApi, state);
    }
  };
}

function updateBadge(chromeApi: ChromeApi, state: BadgeState) {
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
