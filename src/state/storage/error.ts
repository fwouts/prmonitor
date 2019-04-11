import { ChromeApi } from "../../chrome";
import { storage } from "../../storage/internal/chrome-value-storage";

/**
 * Storage of the last error seen when fetching GitHub data.
 */
export const lastErrorStorage = (chromeApi: ChromeApi) =>
  storage<string>(chromeApi, "error");
