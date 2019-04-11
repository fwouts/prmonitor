import { ChromeApi } from "../../chrome";
import { chromeValueStorageWithDefault } from "../../storage/internal/chrome-value-storage";
import { MuteConfiguration } from "../../storage/mute-configuration";

export const NOTHING_MUTED: MuteConfiguration = {
  mutedPullRequests: []
};

export const muteConfigurationStorage = (chromeApi: ChromeApi) =>
  chromeValueStorageWithDefault(chromeApi, "mute", NOTHING_MUTED);
