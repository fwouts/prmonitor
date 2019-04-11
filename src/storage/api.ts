import { MuteConfiguration } from "../state/storage/mute";
import { LoadedState } from "../storage/loaded-state";

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