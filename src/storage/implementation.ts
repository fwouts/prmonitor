import { ChromeApi } from "../chrome/api";
import { Store } from "./api";
import {
  chromeValueStorage,
  chromeValueStorageWithDefault,
} from "./internal/chrome-value-storage";
import { LoadedState } from "./loaded-state";

export function buildStore(chromeApi: ChromeApi): Store {
  return {
    lastError: chromeValueStorage<string>(chromeApi, "error"),
    lastCheck: chromeValueStorage<LoadedState>(chromeApi, "lastCheck"),
    currentlyRefreshing: chromeValueStorageWithDefault<boolean>(
      chromeApi,
      "currentlyRefreshing",
      false
    ),
    notifiedPullRequests: chromeValueStorageWithDefault<string[]>(
      chromeApi,
      "lastSeenPullRequests",
      []
    ),
    token: chromeValueStorage<string>(chromeApi, "gitHubApiToken"),
  };
}
