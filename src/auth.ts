/**
 * Returns the GitHub API token stored in settings.
 */
export async function getGitHubApiToken(): Promise<string> {
  try {
    const localToken = await getGitHubApiTokenFromLocalStorage();
    return localToken;
  } catch {
    // Older versions of PR Monitor saved the token in sync storage.
    const syncToken = await getGitHubApiTokenFromSyncStorage();
    return syncToken;
  }
}

/**
 * Fetches the GitHub API token from local storage.
 */
function getGitHubApiTokenFromLocalStorage() {
  return new Promise<string>((resolve, reject) => {
    chrome.storage.local.get(["gitHubApiToken"], result => {
      if (result.gitHubApiToken) {
        resolve(result.gitHubApiToken);
      } else {
        reject(new Error("GitHub API token is not set."));
      }
    });
  });
}

/**
 * Gets GitHub API token from sync storage instead of local storage.
 */
function getGitHubApiTokenFromSyncStorage() {
  return new Promise<string>((resolve, reject) => {
    chrome.storage.sync.get(["gitHubApiToken"], result => {
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
  return new Promise<string>((resolve, reject) => {
    chrome.storage.local.set(
      {
        gitHubApiToken: token
      },
      resolve
    );
    // Erase from sync storage if it was stored previously.
    chrome.storage.sync.set({
      gitHubApiToken: null
    });
  });
}
