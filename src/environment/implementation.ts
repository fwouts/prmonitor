import { buildBadger } from "../badge/implementation";
import { ChromeApi } from "../chrome/api";
import { buildGitHubLoader } from "../loading/implementation";
import { buildMessenger } from "../messaging/implementation";
import { buildStore } from "../storage/implementation";
import { buildTabOpener } from "../tabs/implementation";
import { Context } from "./api";

export function buildEnvironment(chromeApi: ChromeApi): Context {
  const getCurrentTime = () => Date.now();
  return {
    store: buildStore(chromeApi),
    githubLoader: buildGitHubLoader(),
    badger: buildBadger(chromeApi),
    messenger: buildMessenger(chromeApi),
    tabOpener: buildTabOpener(chromeApi),
    getCurrentTime,
    isOnline: () => navigator.onLine,
  };
}
