import { css, Global } from "@emotion/core";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import ReactDOM from "react-dom";
import { buildBadger } from "./badge/implementation";
import { chromeApiSingleton } from "./chrome/implementation";
import { Popup } from "./components/Popup";
import { buildMessenger } from "./messaging/implementation";
import { buildNotifier } from "./notifications/implementation";
import { Core } from "./state/core";
import { githubLoaderSingleton } from "./state/github-loader";
import { buildStore } from "./storage/implementation";

library.add(faBellSlash);

const chromeApi = chromeApiSingleton;
const githubLoader = githubLoaderSingleton;
const store = buildStore(chromeApi);
const notifier = buildNotifier(chromeApi);
const badger = buildBadger(chromeApi);
const messenger = buildMessenger(chromeApi);

ReactDOM.render(
  <>
    <Global
      styles={css`
        @import url("https://fonts.googleapis.com/css?family=Roboto");

        body {
          background: #f6f8fc;
          color: #444;
          margin: 0;
          padding: 8px;
          overflow: hidden;
          width: 600px;
          font-family: Roboto, sans-serif;
          font-size: 14px;
        }

        a {
          color: #000;
        }
      `}
    />
    <Popup core={new Core(store, githubLoader, notifier, badger, messenger)} />
  </>,
  document.getElementById("root")
);
