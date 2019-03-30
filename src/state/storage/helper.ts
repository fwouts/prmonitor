import { chromeApi } from "../../chrome";

export interface Storage<T> {
  load(): Promise<T>;
  save(value: T | null): Promise<void>;
}

/**
 * Returns a storage handler to load and save from the given key.
 *
 * This doesn't have a default value. When the key is not set, `null` will be returned.
 */
export function storage<T>(key: string): Storage<T | null> {
  return {
    load() {
      return loadFromStorage<T>(key);
    },
    save(value: T | null) {
      return saveToStorage<T>(key, value);
    }
  };
}

/**
 * Returns a storage handler to load and save from the given key.
 *
 * Unlike {@link storage}, this has a default value which it will return when the key is not set.
 */
export function storageWithDefault<T>(
  key: string,
  defaultValue: T
): Storage<T> {
  return {
    async load() {
      return (await loadFromStorage<T>(key)) || defaultValue;
    },
    save(value: T | null) {
      return saveToStorage<T>(key, value);
    }
  };
}

function loadFromStorage<T>(key: string): Promise<T | null> {
  return new Promise<T | null>(resolve => {
    chromeApi.storage.local.get([key], result => {
      resolve(result[key] ? JSON.parse(result[key]) : null);
    });
  });
}

function saveToStorage<T>(key: string, value: T | null): Promise<void> {
  return new Promise<void>(resolve => {
    chromeApi.storage.local.set(
      {
        [key]: JSON.stringify(value)
      },
      resolve
    );
  });
}
