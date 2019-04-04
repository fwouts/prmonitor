import { ReposGetResponse } from "@octokit/rest";

/**
 * Returns a predicate that will return true if the repo was pushed after the given timestamp.
 *
 * If `pushedAt` is null, the predicate will always return true.
 */
export function repoWasPushedAfter(
  pushedAt: string | null
): (repo: ReposGetResponse) => boolean {
  if (!pushedAt) {
    return () => true;
  }
  const minPushedAt = new Date(pushedAt);
  return (repo: ReposGetResponse) => new Date(repo.pushed_at) > minPushedAt;
}
