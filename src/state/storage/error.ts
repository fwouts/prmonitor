import { ChromeApi } from "../../chrome";
import { chromeValueStorage } from "../../storage/internal/chrome-value-storage";

/**
 * Storage of the last error seen when fetching GitHub data.
 */
export const lastErrorStorage = (chromeApi: ChromeApi) =>
  chromeValueStorage<string>(chromeApi, "error");
