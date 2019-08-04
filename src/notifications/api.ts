import { EnrichedPullRequest } from "../filtering/enriched-pull-request";

export interface Notifier {
  notify(
    pullRequests: EnrichedPullRequest[],
    alreadyNotifiedPullRequestUrls: Set<string>
  ): void;
  registerClickListener(clickListener: NotifierClickListener): void;
}

export type NotifierClickListener = (pullRequestUrl: string) => void;
