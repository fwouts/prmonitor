import { ChromeApi } from "../chrome/api";
import { Store } from "../storage/api";
import { TabOpener } from "./api";

export function buildTabOpener(
  chromeApi: ChromeApi,
  store: Store,
  getCurrentTime: () => number
): TabOpener {
  return {
    async openPullRequest(pullRequestUrl: string) {
      const lastRequestTimestamp = await store.lastRequestForTabsPermission.load();
      if (lastRequestTimestamp !== null) {
        // We requested the permission before already. Let's not be persistent.
        chromeApi.permissions.getAll(permissions => {
          const granted = permissions.permissions
            ? permissions.permissions.indexOf("tabs") !== -1
            : false;
          openTab(chromeApi, pullRequestUrl, granted);
        });
      } else {
        await store.lastRequestForTabsPermission.save(getCurrentTime());
        chromeApi.permissions.request(
          {
            permissions: ["tabs"]
          },
          granted => {
            openTab(chromeApi, pullRequestUrl, granted);
          }
        );
      }
    }
  };
}

function openTab(
  chromeApi: ChromeApi,
  pullRequestUrl: string,
  permissionGranted: boolean
) {
  if (permissionGranted) {
    chromeApi.tabs.query({}, tabs => {
      const existingTab = tabs.find(tab =>
        tab.url ? tab.url.startsWith(pullRequestUrl) : false
      );
      if (existingTab) {
        chromeApi.tabs.highlight({
          windowId: existingTab.windowId,
          tabs: existingTab.index
        });
        chromeApi.windows.update(existingTab.windowId, { focused: true });
      } else {
        chromeApi.tabs.create({
          url: pullRequestUrl
        });
      }
    });
  } else {
    chromeApi.tabs.create({
      url: pullRequestUrl
    });
  }
}
