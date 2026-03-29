import { ChromeApi } from "../chrome/api";
import { CrossScriptMessenger } from "./api";

export function buildMessenger(chromeApi: ChromeApi): CrossScriptMessenger {
  return {
    listen(callback) {
      chromeApi.runtime.onMessage.addListener(callback);
    },
    send(message) {
      // In manifest v3, sendMessage returns a Promise that rejects if no receiver exists.
      // We need to catch and ignore this error to prevent uncaught promise rejections.
      chromeApi.runtime.sendMessage(message).catch((error) => {
        console.debug("Message send failed", { message, error });
      });
    },
  };
}
