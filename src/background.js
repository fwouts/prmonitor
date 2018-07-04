// This is the background script of the Chrome extension.

const CHECK_PULL_REQUESTS_ALARM_KEY = "check-pull-requests";

// Beause it isn't a persistent background script, we cannot simply use
// setInterval() to schedule regular checks for new pull requests.
// Instead, we set an alarm every minute.
chrome.alarms.create(CHECK_PULL_REQUESTS_ALARM_KEY, {
  periodInMinutes: 1
});

// When alarm is triggered, call checkPullRequests().
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === CHECK_PULL_REQUESTS_ALARM_KEY) {
    checkPullRequests().catch(console.error);
  }
});

// Also call checkPullRequests() on install.
chrome.runtime.onInstalled.addListener(() => {
  checkPullRequests().catch(console.error);
});

/**
 * Checks if there are any new pull requests and notifies the user when required.
 */
async function checkPullRequests() {
  const token = await fetchGitHubApiToken();
  const { login, pullRequests } = await loadPullRequests(token);
  const unreviewedPullRequests = excludeReviewedPullRequests(
    login,
    pullRequests
  );
  updateBadge(unreviewedPullRequests.size);
  showNotificationForNewPullRequests(unreviewedPullRequests);
}

/**
 * Fetches the GitHub API token from local storage.
 *
 * This token can be set by the user in the popup.
 */
async function fetchGitHubApiToken() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["gitHubApiToken"], result => {
      if (result.gitHubApiToken) {
        resolve(result.gitHubApiToken);
      } else {
        reject("GitHub API token is not set.");
      }
    });
  });
}

/**
 * Fetches all the pull requests assigned to the current user, including already reviewed PRs.
 */
async function loadPullRequests(token) {
  const data = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `bearer ${token}`
    },
    body: JSON.stringify({
      query: `{
  viewer {
    login
    repositories(first: 50, affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
      nodes {
        nameWithOwner
        pullRequests(first: 50, states: [OPEN]) {
          nodes {
            url
            title
            updatedAt
            reviews(first: 50) {
              nodes {
                author {
                  login
                }
                createdAt
                state
              }
            }
            comments(first: 50) {
              nodes {
                author {
                  login
                }
                createdAt
              }
            }
            author {
              login
            }
            assignees(first: 20) {
              nodes {
                login
              }
            }
            reviewRequests(first: 20) {
              nodes {
                requestedReviewer {
                  ... on User {
                    login
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`
    })
  });
  const result = await data.json();
  if (result.errors) {
    throw result.errors[0];
  }
  const pullRequests = new Set();
  const login = result.data.viewer.login;
  for (const repository of result.data.viewer.repositories.nodes) {
    for (const pullRequest of repository.pullRequests.nodes) {
      for (const assignee of pullRequest.assignees.nodes) {
        if (assignee.login === login) {
          pullRequests.add(pullRequest);
        }
      }
      for (const reviewRequest of pullRequest.reviewRequests.nodes) {
        if (reviewRequest.requestedReviewer.login === login) {
          pullRequests.add(pullRequest);
        }
      }
    }
  }
  return { login, pullRequests };
}

/**
 * Returns a subset of pull requests that have not yet been reviewed by the current user.
 */
function excludeReviewedPullRequests(login, pullRequests) {
  const unreviewedPullRequests = new Set();
  for (const pullRequest of pullRequests) {
    const lastUpdatedTime = new Date(pullRequest.updatedAt).getTime();
    let lastReviewedOrCommentedAtTime = 0;
    let approvedByViewer = false;
    for (const review of pullRequest.reviews.nodes) {
      if (review.author.login !== login) {
        continue;
      }
      if (review.state === "APPROVED") {
        approvedByViewer = true;
      }
      const reviewTime = new Date(review.createdAt).getTime();
      lastReviewedOrCommentedAtTime = Math.max(
        reviewTime,
        lastReviewedOrCommentedAtTime
      );
    }
    for (const comment of pullRequest.comments.nodes) {
      if (comment.author.login !== login) {
        continue;
      }
      const commentTime = new Date(comment.createdAt).getTime();
      lastReviewedOrCommentedAtTime = Math.max(
        commentTime,
        lastReviewedOrCommentedAtTime
      );
    }
    const isReviewed =
      approvedByViewer || lastReviewedOrCommentedAtTime > lastUpdatedTime;
    if (!isReviewed) {
      unreviewedPullRequests.add(pullRequest);
    }
  }
  return unreviewedPullRequests;
}

/**
 * Updates the unread PR count in the Chrome extension badge, as well as its color.
 */
function updateBadge(prCount) {
  chrome.browserAction.setBadgeText({
    text: "" + prCount
  });
  chrome.browserAction.setBadgeBackgroundColor({
    color: prCount === 0 ? "#4d4" : "#f00"
  });
}

// Used to store the URLs of previous PRs that we've already notified about.
const alreadyNotifiedPullRequestUrls = new Set();

/**
 * Shows a notification for each pull request that we haven't yet notified about.
 */
function showNotificationForNewPullRequests(pullRequests) {
  for (const pullRequest of pullRequests) {
    showNotificationIfNewPullRequest(pullRequest);
  }
}

/**
 * Shows a notification if the pull request is new.
 */
function showNotificationIfNewPullRequest(pullRequest) {
  if (alreadyNotifiedPullRequestUrls.has(pullRequest.url)) {
    return;
  }
  // We set the notification ID to the URL so that we simply cannot have duplicate
  // notifications about the same pull request.
  const notificationId = pullRequest.url;
  chrome.notifications.create(
    notificationId,
    {
      type: "basic",
      iconUrl: "images/GitHub-Mark-120px-plus.png",
      title: "New pull request",
      message: pullRequest.title,
      requireInteraction: true
    },
    notificationId => {
      chrome.notifications.onClicked.addListener(clickedNotificationId => {
        if (notificationId !== clickedNotificationId) {
          return;
        }
        window.open(pullRequest.url);
        chrome.notifications.clear(notificationId);
      });
    }
  );
  alreadyNotifiedPullRequestUrls.add(pullRequest.url);
}
