import { PullRequest } from "../storage/loaded-state";

export interface Notifier {
  notify(
    unreviewedPullRequests: PullRequest[],
    alreadyNotifiedPullRequestUrls: Set<string>
  ): void;
  registerClickListener(clickListener: NotifierClickListener): void;
}

export type NotifierClickListener = (pullRequestUrl: string) => void;
