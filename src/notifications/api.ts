import { PullRequest } from "../state/storage/last-check";

export type Notifier = (
  unreviewedPullRequests: PullRequest[],
  notifiedPullRequestUrls: Set<string>
) => void;
