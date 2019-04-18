import { Badger } from "../badge/api";
import { CrossScriptMessenger } from "../messaging/api";
import { Notifier } from "../notifications/api";
import { GitHubLoader } from "../state/github-loader";
import { Store } from "../storage/api";

export interface Environment {
  store: Store;
  githubLoader: GitHubLoader;
  notifier: Notifier;
  badger: Badger;
  messenger: CrossScriptMessenger;
}
