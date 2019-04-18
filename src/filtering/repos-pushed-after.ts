import { Repo } from "../storage/loaded-state";

/**
 * Returns a predicate that will return true if the repo was pushed after the given timestamp.
 *
 * If `pushedAt` is null, the predicate will always return true.
 */
export function repoWasPushedAfter(
  pushedAt: string | null
): (repo: Repo) => boolean {
  if (!pushedAt) {
    return () => true;
  }
  const minPushedAt = new Date(pushedAt);
  return (repo: Repo) => new Date(repo.pushedAt) > minPushedAt;
}
