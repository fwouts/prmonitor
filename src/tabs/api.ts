/**
 * TabOpener opens tabs intelligently (reusing them when possible).
 */
export interface TabOpener {
  openPullRequest(pullRequestUrl: string): void;
}
