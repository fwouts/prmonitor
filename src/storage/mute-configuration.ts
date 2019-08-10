import assertNever from "assert-never";
import { cloneDeep } from "lodash";
import { PullRequestReference } from "../github-api/api";

export const NOTHING_MUTED: MuteConfiguration = {
  mutedPullRequests: [],
  ignored: {}
};

export interface MuteConfiguration {
  // Note: it's expected that a specific pull request only occurs once in the
  // list.
  //
  // We could have used a dictionary keyed by owner/name/number instead, but
  // hey, this was hacked up too quickly and now it's persisted in people's
  // local storage so let's leave it for now until there's a pressing need for a
  // breaking change (we could do a smooth transition with a bit of effort).
  mutedPullRequests: MutedPullRequest[];

  ignored?: {
    [owner: string]: IgnoreConfiguration;
  };
}

export function addMute(
  config: MuteConfiguration,
  pullRequest: PullRequestReference,
  muteType: MuteType
): MuteConfiguration {
  const muteConfiguration = {
    // Remove any previous mute of this PR.
    mutedPullRequests: [
      ...config.mutedPullRequests.filter(
        pr =>
          pr.repo.owner !== pullRequest.repo.owner ||
          pr.repo.name !== pullRequest.repo.name ||
          pr.number !== pullRequest.number
      )
    ],
    ignored: cloneDeep(config.ignored || {})
  };
  // Add the new mute.
  switch (muteType) {
    case "next-update":
      muteConfiguration.mutedPullRequests.push({
        ...pullRequest,
        until: {
          kind: "next-update",
          mutedAtTimestamp: Date.now()
        }
      });
      break;
    case "1-hour":
      muteConfiguration.mutedPullRequests.push({
        ...pullRequest,
        until: {
          kind: "specific-time",
          unmuteAtTimestamp: Date.now() + 3600 * 1000
        }
      });
      break;
    case "forever":
      muteConfiguration.mutedPullRequests.push({
        ...pullRequest,
        until: {
          kind: "forever"
        }
      });
      break;
    case "repo":
      const existingIgnoreConfig =
        muteConfiguration.ignored[pullRequest.repo.owner];
      if (existingIgnoreConfig && existingIgnoreConfig.kind === "ignore-only") {
        existingIgnoreConfig.repoNames.push(pullRequest.repo.name);
      } else {
        muteConfiguration.ignored[pullRequest.repo.owner] = {
          kind: "ignore-only",
          repoNames: [pullRequest.repo.name]
        };
      }
      break;
    case "owner":
      muteConfiguration.ignored[pullRequest.repo.owner] = {
        kind: "ignore-all"
      };
      break;
    default:
      throw assertNever(muteType);
  }
  return muteConfiguration;
}

export function removePullRequestMute(
  config: MuteConfiguration,
  pullRequest: PullRequestReference
): MuteConfiguration {
  return {
    mutedPullRequests: config.mutedPullRequests.filter(
      pr =>
        pr.repo.owner !== pullRequest.repo.owner ||
        pr.repo.name !== pullRequest.repo.name ||
        pr.number !== pullRequest.number
    ),
    ignored: config.ignored || {}
  };
}

export function removeOwnerMute(
  config: MuteConfiguration,
  owner: string
): MuteConfiguration {
  const ignored = cloneDeep(config.ignored || {});
  delete ignored[owner];
  return {
    ...config,
    ignored
  };
}

export function removeRepositoryMute(
  config: MuteConfiguration,
  owner: string,
  repo: string
): MuteConfiguration {
  const ignored = cloneDeep(config.ignored || {});
  const ownerConfig = ignored[owner];
  if (ownerConfig) {
    switch (ownerConfig.kind) {
      case "ignore-all":
        delete ignored[owner];
        break;
      case "ignore-only":
        ownerConfig.repoNames = ownerConfig.repoNames.filter(
          repoName => repoName !== repo
        );
        if (ownerConfig.repoNames.length === 0) {
          delete ignored[owner];
        }
        break;
    }
  }
  return {
    ...config,
    ignored
  };
}

export type MuteType = "next-update" | "1-hour" | "forever" | "repo" | "owner";

export interface MutedPullRequest {
  repo: {
    owner: string;
    name: string;
  };
  number: number;
  until: MutedUntil;
}

export type MutedUntil =
  | MutedUntilNextUpdateByAuthor
  | MutedUntilSpecificTime
  | MutedForever;

export interface MutedUntilNextUpdateByAuthor {
  kind: "next-update";

  /**
   * The timestamp at which the PR was muted.
   *
   * Any update by the author after this timestamp will make the PR re-appear.
   */
  mutedAtTimestamp: number;
}

export interface MutedUntilSpecificTime {
  kind: "specific-time";

  /**
   * The timestamp at which the PR should no longer be muted.
   *
   * The PR will stay muted even if the author updates it.
   */
  unmuteAtTimestamp: number;
}

export interface MutedForever {
  kind: "forever";
}

export type IgnoreConfiguration =
  | IgnoreConfigurationAllRepositories
  | IgnoreConfigurationSpecificRepositories;

export interface IgnoreConfigurationAllRepositories {
  kind: "ignore-all";
}

export interface IgnoreConfigurationSpecificRepositories {
  kind: "ignore-only";
  repoNames: string[];
}
