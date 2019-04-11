import { ChromeApi } from "../../chrome";
import { ValueStorage } from "../api";
/**
 * Returns a storage handler to load and save from the given key.
 *
 * This doesn't have a default value. When the key is not set, `null` will be returned.
 */
export function storage<T>(
  chromeApi: ChromeApi,
  key: string
): ValueStorage<T | null> {
  return {
    load() {
      return loadFromStorage<T>(chromeApi, key);
    },
    save(value: T | null) {
      return saveToStorage<T>(chromeApi, key, value);
    }
  };
}

/**
 * Returns a storage handler to load and save from the given key.
 *
 * Unlike {@link storage}, this has a default value which it will return when the key is not set.
 */
export function storageWithDefault<T>(
  chromeApi: ChromeApi,
  key: string,
  defaultValue: T
): ValueStorage<T> {
  return {
    async load() {
      return (await loadFromStorage<T>(chromeApi, key)) || defaultValue;
    },
    save(value: T | null) {
      return saveToStorage<T>(chromeApi, key, value);
    }
  };
}

function loadFromStorage<T>(
  chromeApi: ChromeApi,
  key: string
): Promise<T | null> {
  return new Promise<T | null>(resolve => {
    chromeApi.storage.local.get([key], dict => {
      let result;
      try {
        result = JSON.parse(dict[key]);
      } catch (e) {
        // Because we were previously storing values directly without JSON serialization,
        // we may need to fall back to non-JSON deserialization.
        //
        // For example, the API token was previously stored as `abc`, not `"abc"`.
        result = dict[key];
      }
      resolve(result || null);
    });
  });
}

function saveToStorage<T>(
  chromeApi: ChromeApi,
  key: string,
  value: T | null
): Promise<void> {
  return new Promise<void>(resolve => {
    chromeApi.storage.local.set(
      {
        [key]: JSON.stringify(value)
      },
      resolve
    );
  });
}
