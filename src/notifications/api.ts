import { PullRequest } from "../storage/loaded-state";

export interface Notifier {
  notify(
    unreviewedPullRequests: PullRequest[],
    notifiedPullRequestUrls: Set<string>
  ): void;
  registerClickListener(): void;
}
