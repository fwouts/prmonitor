# PR Monitor

> **Note** Looking for new maintainer
>
> PR Monitor is stable, no new features are planned and it's in maintenance only.
>
> If you'd like to improve it further, please send a pull request or feel free to fork the project.

<p align="center">
  <a href="https://chrome.google.com/webstore/detail/pr-monitor/pneldbfhblmldbhmkolclpkijgnjcmng">
    <img src="./images/logo-chrome.png" />
  </a>
  <a href="https://addons.mozilla.org/en-US/firefox/addon/pr-monitor">
    <img src="./images/logo-firefox.png" />
  </a>
</p>

[![CircleCI](https://circleci.com/gh/fwouts/prmonitor.svg?style=svg)](https://circleci.com/gh/fwouts/prmonitor)
![License](https://img.shields.io/github/license/fwouts/prmonitor.svg)
[![Chrome Web Store](https://img.shields.io/chrome-web-store/v/pneldbfhblmldbhmkolclpkijgnjcmng.svg)](https://chrome.google.com/webstore/detail/pr-monitor/pneldbfhblmldbhmkolclpkijgnjcmng)
[![Mozilla Add-on](https://img.shields.io/amo/v/pr-monitor.svg)](https://addons.mozilla.org/en-US/firefox/addon/pr-monitor)

PR Monitor is a Chrome and Firefox extension that helps you keep track of incoming and outgoing PRs, and notifies you when you receive a pull request on GitHub.

## What does it look like?

Here's a quick demo of PR Monitor in action:

<p align="center">
  <a href="https://www.youtube.com/watch?v=kUtAhvPIg3Q" target="_blank">
    <img src="./screencasts/latest.gif" />
  </a>
  <i>GIF made with <a href="https://www.producthunt.com/posts/gifski-2">Gifski 2</a></i>
</p>

## How to install

1. Install the [Chrome extension](https://chrome.google.com/webstore/detail/pr-monitor/pneldbfhblmldbhmkolclpkijgnjcmng) or [Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/pr-monitor)
2. [Create a GitHub personal access token with the **repo** permission](https://github.com/settings/tokens)
3. Enter the token into the extension
4. Enjoy

## Using PR Monitor with GitHub Enterprise

In order to use PR Monitor with GitHub Enterprise, you'll need to download the source code and set the `baseUrl` to match your GitHub Enterprise API URL, then compile the code (see below).

It's a two-line change, so don't be afraid! Refer to [#769](https://github.com/fwouts/prmonitor/pull/769) for an example.

## How to build it yourself

If you don't trust a random browser extension on the Internet with your GitHub token, that's understandable.

Here's how to build the extension yourself from source:

1. Install [Yarn](https://yarnpkg.com).
2. Install dependencies with `yarn install`.
3. Run `yarn build`.
4. In Chrome, go to chrome://extensions and enable "Developer mode" in the top-right corner.
5. Click "Load unpacked" and select the generated `dist/` directory.

## Feedback

Feel free to [file an issue](https://github.com/zenclabs/prmonitor/issues) with your feedback.
