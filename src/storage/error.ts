import { ChromeApi } from "../chrome/api";
import { storage } from "./helper";

/**
 * Storage of the last error seen when fetching GitHub data.
 */
export const lastErrorStorage = (chromeApi: ChromeApi) =>
  storage<string>(chromeApi, "error");
