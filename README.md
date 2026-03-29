> [!WARNING]
> **This project is no longer maintained.**
>
> Life got busy — work, kids, and the usual chaos. I no longer have the time or energy to keep up with issues, PRs, or updates. PR Monitor has been effectively abandoned.
>
> The code is still here and you're welcome to fork it, but don't expect updates or support.
>
> The Chrome and Firefox extensions will be removed from their respective stores soon.

# PR Monitor

![License](https://img.shields.io/github/license/fwouts/prmonitor.svg)

PR Monitor is a Chrome and Firefox extension that helps you keep track of incoming and outgoing PRs, and notifies you when you receive a pull request on GitHub.

## What does it look like?

Here's a quick demo of PR Monitor in action:

<p align="center">
  <a href="https://www.youtube.com/watch?v=kUtAhvPIg3Q" target="_blank">
    <img src="./screencasts/latest.gif" />
  </a>
  <i>GIF made with <a href="https://www.producthunt.com/posts/gifski-2">Gifski 2</a></i>
</p>

## How to build it yourself

If you don't trust a random browser extension on the Internet with your GitHub token, that's understandable.

Here's how to build the extension yourself from source:

1. Install [Yarn](https://yarnpkg.com).
2. Install dependencies with `yarn install`.
3. Run `yarn build`.
4. In Chrome, go to chrome://extensions and enable "Developer mode" in the top-right corner.
5. Click "Load unpacked" and select the generated `dist/` directory.

## Using PR Monitor with GitHub Enterprise

In order to use PR Monitor with GitHub Enterprise, you'll need to download the source code and set the `baseUrl` to match your GitHub Enterprise API URL, then compile the code (see below).

It's a two-line change, so don't be afraid! Refer to [#769](https://github.com/fwouts/prmonitor/pull/769) for an example.