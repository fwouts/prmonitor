import { storage } from "./helper";

/**
 * Storage of the user's provided GitHub token.
 */
export const tokenStorage = storage<string>("gitHubApiToken");
