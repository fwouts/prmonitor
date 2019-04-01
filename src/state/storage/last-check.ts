import { storage } from "./helper";

/**
 * Storage of the time we last checked for pull requests.
 */
export const lastCheckTimeStorage = storage<string>("lastCheckTime");

// STRATEGY:
// - for every repo, check previously unreviewed PRs to see if action was taken or not
// - for every repo that was pushed after last check time (minus 1 minute for safety), check if there are new PRs
// - only for new PRs, check if user needs to review

// ALSO TO DO: expand this strategy to cover own PRs.
