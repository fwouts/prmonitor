import { chromeApi } from "../../chrome";

/**
 * Returns the GitHub API token stored in settings.
 */
export async function loadApiTokenFromStorage(): Promise<string | null> {
  return new Promise<string | null>(resolve => {
    chromeApi.storage.local.get(["gitHubApiToken"], result => {
      resolve(result.gitHubApiToken || null);
    });
  });
}

/**
 * Updates the GitHub API token in settings.
 */
export function saveApiTokenToStorage(token: string) {
  return new Promise<string>(resolve => {
    chromeApi.storage.local.set(
      {
        gitHubApiToken: token
      },
      resolve
    );
  });
}
