import { chromeApi } from "./chrome";

/**
 * Returns the GitHub API token stored in settings.
 */
export async function getGitHubApiToken(): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    chromeApi.storage.local.get(["gitHubApiToken"], result => {
      if (result.gitHubApiToken) {
        resolve(result.gitHubApiToken);
      } else {
        reject(new Error("GitHub API token is not set."));
      }
    });
  });
}

/**
 * Updates the GitHub API token in settings.
 */
export function updateGitHubApiToken(token: string) {
  return new Promise<string>(resolve => {
    chromeApi.storage.local.set(
      {
        gitHubApiToken: token
      },
      resolve
    );
  });
}
