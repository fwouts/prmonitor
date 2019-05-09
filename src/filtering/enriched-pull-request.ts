import { PullRequest } from "../storage/loaded-state";
import { PullRequestStatus } from "./status";

export interface EnrichedPullRequest extends PullRequest {
  status: PullRequestStatus;
}
