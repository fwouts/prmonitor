import { chromeApi } from "../../chrome";

export async function saveRepoListToStorage(repos: RepoListStorage) {
  await new Promise(resolve => {
    chromeApi.storage.local.set(
      {
        repos: JSON.stringify(repos)
      },
      resolve
    );
  });
}

export async function loadRepoListFromStorage(): Promise<RepoListStorage | null> {
  return new Promise<RepoListStorage>(resolve =>
    chromeApi.storage.local.get(["repos"], result =>
      resolve(result.repos ? JSON.parse(result.repos) : null)
    )
  );
}

export interface RepoListStorage {
  timestamp: number;
  list: RepoSummary[];
}

export interface RepoSummary {
  owner: string;
  name: string;
}
