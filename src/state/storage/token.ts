import { ChromeApi } from "../../chrome";
import { chromeValueStorage } from "../../storage/internal/chrome-value-storage";

/**
 * Storage of the user's provided GitHub token.
 */
export const tokenStorage = (chromeApi: ChromeApi) =>
  chromeValueStorage<string>(chromeApi, "gitHubApiToken");
