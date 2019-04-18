import { buildBadger } from "../badge/implementation";
import { ChromeApi } from "../chrome/api";
import { buildGitHubLoader } from "../loading/github-loader";
import { buildMessenger } from "../messaging/implementation";
import { buildNotifier } from "../notifications/implementation";
import { buildStore } from "../storage/implementation";
import { Environment } from "./api";

export function buildEnvironment(chromeApi: ChromeApi): Environment {
  return {
    store: buildStore(chromeApi),
    githubLoader: buildGitHubLoader(),
    notifier: buildNotifier(chromeApi),
    badger: buildBadger(chromeApi),
    messenger: buildMessenger(chromeApi),
    isOnline: () => navigator.onLine
  };
}
