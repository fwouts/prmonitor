import { Badger } from "../badge/api";
import { GitHubLoader } from "../loading/api";
import { CrossScriptMessenger } from "../messaging/api";
import { Notifier } from "../notifications/api";
import { Store } from "../storage/api";
import { TabOpener } from "../tabs/api";

export interface Environment {
  store: Store;
  githubLoader: GitHubLoader;
  notifier: Notifier;
  badger: Badger;
  messenger: CrossScriptMessenger;
  tabOpener: TabOpener;
  getCurrentTime(): number;
  isOnline(): boolean;
}
