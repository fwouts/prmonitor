import { Storage } from "../state/storage/helper";
import { LoadedState } from "../state/storage/last-check";
import { MuteConfiguration } from "../state/storage/mute";

export interface Store {
  lastError: Storage<string | null>;
  lastCheck: Storage<LoadedState | null>;
  muteConfiguration: Storage<MuteConfiguration>;
  notifiedPullRequests: Storage<string[]>;
  token: Storage<string | null>;
}
