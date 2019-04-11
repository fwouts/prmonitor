import { ChromeApi } from "../../chrome";
import { lastErrorStorage } from "./error";
import { Storage } from "./helper";
import { lastCheckStorage, LoadedState } from "./last-check";
import { MuteConfiguration, muteConfigurationStorage } from "./mute";
import { notifiedPullRequestsStorage } from "./notified-pull-requests";
import { tokenStorage } from "./token";

export function getStore(chromeApi: ChromeApi): Store {
  return {
    lastError: lastErrorStorage(chromeApi),
    lastCheck: lastCheckStorage(chromeApi),
    muteConfiguration: muteConfigurationStorage(chromeApi),
    notifiedPullRequests: notifiedPullRequestsStorage(chromeApi),
    token: tokenStorage(chromeApi)
  };
}

export interface Store {
  lastError: Storage<string | null>;
  lastCheck: Storage<LoadedState | null>;
  muteConfiguration: Storage<MuteConfiguration>;
  notifiedPullRequests: Storage<string[]>;
  token: Storage<string | null>;
}
