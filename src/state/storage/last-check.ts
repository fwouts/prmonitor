import { ChromeApi } from "../../chrome";
import { chromeValueStorage } from "../../storage/internal/chrome-value-storage";
import { LoadedState } from "../../storage/loaded-state";

/**
 * Storage of the last information we loaded about pull requests.
 */
export const lastCheckStorage = (chromeApi: ChromeApi) =>
  chromeValueStorage<LoadedState>(chromeApi, "lastCheck");
