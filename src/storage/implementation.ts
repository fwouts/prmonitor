import { ChromeApi } from "../chrome/api";
import { Store } from "./api";
import {
  chromeValueStorage,
  chromeValueStorageWithDefault
} from "./internal/chrome-value-storage";
import { LoadedState } from "./loaded-state";
import { NOTHING_MUTED } from "./mute-configuration";

export function buildStore(chromeApi: ChromeApi): Store {
  return {
    lastError: chromeValueStorage<string>(chromeApi, "error"),
    lastCheck: chromeValueStorage<LoadedState>(chromeApi, "lastCheck"),
    currentlyRefreshing: chromeValueStorageWithDefault<boolean>(
      chromeApi,
      "currentlyRefreshing",
      false
    ),
    muteConfiguration: chromeValueStorageWithDefault(
      chromeApi,
      "mute",
      NOTHING_MUTED
    ),
    notifiedPullRequests: chromeValueStorageWithDefault<string[]>(
      chromeApi,
      "lastSeenPullRequests",
      []
    ),
    token: chromeValueStorage<string>(chromeApi, "gitHubApiToken"),
    lastRequestForTabsPermission: chromeValueStorage<number>(
      chromeApi,
      "lastRequestForTabsPermission"
    )
  };
}
