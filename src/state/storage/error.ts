import { storage } from "./helper";

/**
 * Storage of the last error seen when fetching GitHub data.
 */
export const lastErrorStorage = storage<string>("error");
