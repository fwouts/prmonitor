import { ChromeApi } from "../../chrome";
import { Store } from "../../storage/api";
import { lastErrorStorage } from "./error";
import { lastCheckStorage } from "./last-check";
import { muteConfigurationStorage } from "./mute";
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
