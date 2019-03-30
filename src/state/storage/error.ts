import { chromeApi } from "../../chrome";

/**
 * Returns the last error message from storage.
 */
export async function loadErrorFromStorage(): Promise<string | null> {
  return new Promise<string | null>(resolve => {
    chromeApi.storage.local.get(["error"], result => {
      resolve(result.error || null);
    });
  });
}

/**
 * Saves the error message to storage.
 */
export function saveErrorToStorage(error: string | null) {
  return new Promise<string>(resolve => {
    chromeApi.storage.local.set(
      {
        error
      },
      resolve
    );
  });
}
