# PR Monitor

[![CircleCI](https://circleci.com/gh/zenclabs/prmonitor.svg?style=svg)](https://circleci.com/gh/zenclabs/prmonitor)

PR Monitor is a Chrome extension that notifies you when you receive a pull request on GitHub.

## How to install

1. Install the [Chrome extension](https://chrome.google.com/webstore/detail/pr-monitor/pneldbfhblmldbhmkolclpkijgnjcmng) from Chrome Web Store
2. [Create a GitHub personal access token with the **repo** permission](https://github.com/settings/tokens)
3. Enter the token into the extension
4. Enjoy

## How to build it yourself

1. Install [Bazel](https://bazel.build)
2. Run `bazel build //...`
3. Install the unpacked Chrome extension from `bazel-genfiles/extension-dir`

## Feedback

Feel free to [file an issue](https://github.com/zenclabs/prmonitor/issues) with your feedback
or get in touch by email: hi [at] zenc [dot] io.
