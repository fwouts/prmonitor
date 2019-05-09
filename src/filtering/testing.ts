import { PullRequest } from "../storage/loaded-state";
import { MuteConfiguration } from "../storage/mute-configuration";
import { Filter, filterPullRequests } from "./filters";

export function getFilteredBucket(
  userLogin: string,
  muteConfiguration: MuteConfiguration,
  pr: PullRequest
) {
  const filteredPullRequests = filterPullRequests(
    userLogin,
    [pr],
    muteConfiguration
  );
  const filters: Filter[] = [];
  if (filteredPullRequests.incoming.length > 0) {
    filters.push(Filter.INCOMING);
  }
  if (filteredPullRequests.muted.length > 0) {
    filters.push(Filter.MUTED);
  }
  if (filteredPullRequests.reviewed.length > 0) {
    filters.push(Filter.REVIEWED);
  }
  if (filteredPullRequests.mine.length > 0) {
    filters.push(Filter.MINE);
  }
  return filters;
}
