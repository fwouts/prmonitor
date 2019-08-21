import { PullRequest } from "../storage/loaded-state";
import { PullRequestState } from "./status";

export interface EnrichedPullRequest extends PullRequest {
  state: PullRequestState;
}
