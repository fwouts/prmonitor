import { ChromeApi } from "../../chrome";
import { storage } from "./helper";

/**
 * Storage of the user's provided GitHub token.
 */
export const tokenStorage = (chromeApi: ChromeApi) =>
  storage<string>(chromeApi, "gitHubApiToken");
