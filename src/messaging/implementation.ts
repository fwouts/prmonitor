import { ChromeApi } from "../chrome/api";
import { CrossScriptMessenger } from "./api";

export function buildMessenger(chromeApi: ChromeApi): CrossScriptMessenger {
  return {
    listen(callback) {
      chromeApi.runtime.onMessage.addListener(callback);
    },
    send(message) {
      chromeApi.runtime.sendMessage(message);
    },
  };
}
