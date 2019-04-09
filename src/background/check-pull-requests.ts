import { showBadgeError } from "../badge";
import { store } from "../state/store";

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
export async function checkPullRequests() {
  let error;
  try {
    await store.github.start();
    if (!store.github.token) {
      return;
    }
    await store.github.refreshPullRequests();
    error = null;
  } catch (e) {
    error = e;
    await showBadgeError();
  }
  store.github.setError(error ? error.message : null);
}
