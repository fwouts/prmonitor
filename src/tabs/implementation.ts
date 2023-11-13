import { ChromeApi } from "../chrome/api";
import { TabOpener } from "./api";

export function buildTabOpener(chromeApi: ChromeApi): TabOpener {
  return {
    async openPullRequest(pullRequestUrl: string) {
      chromeApi.tabs.create({
        url: pullRequestUrl,
      });
    },
  };
}
