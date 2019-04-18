import { ChromeApi } from "../chrome/api";
import { TabOpener } from "./api";

export function buildTabOpener(chromeApi: ChromeApi): TabOpener {
  return {
    openPullRequest(pullRequestUrl: string) {
      chromeApi.tabs.query({}, tabs => {
        const existingTab = tabs.find(tab =>
          tab.url ? tab.url.startsWith(pullRequestUrl) : false
        );
        if (existingTab) {
          chromeApi.tabs.highlight({
            tabs: existingTab.index
          });
        } else {
          window.open(pullRequestUrl);
        }
      });
    }
  };
}
