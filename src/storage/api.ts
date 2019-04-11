import { LoadedState } from "../storage/loaded-state";
import { MuteConfiguration } from "./mute-configuration";

export interface Store {
  lastError: ValueStorage<string | null>;
  lastCheck: ValueStorage<LoadedState | null>;
  muteConfiguration: ValueStorage<MuteConfiguration>;
  notifiedPullRequests: ValueStorage<string[]>;
  token: ValueStorage<string | null>;
}

export interface ValueStorage<T> {
  load(): Promise<T>;
  save(value: T | null): Promise<void>;
}
