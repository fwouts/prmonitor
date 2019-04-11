import { PullRequest } from "../state/storage/last-check";

export interface Notifier {
  notify(
    unreviewedPullRequests: PullRequest[],
    notifiedPullRequestUrls: Set<string>
  ): void;
  registerClickListener(): void;
}
