import { css, Global } from "@emotion/core";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import ReactDOM from "react-dom";
import { chromeApiSingleton } from "./chrome";
import { Popup } from "./components/Popup";
import { buildNotifier } from "./notifications/implementation";
import { Core } from "./state/core";
import { githubLoaderSingleton } from "./state/github-loader";
import { getStore } from "./state/storage/store";
import { buildBadger } from "./badge/implementation";

library.add(faBellSlash);

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
    <Popup
      core={
        new Core(
          chromeApiSingleton,
          getStore(chromeApiSingleton),
          githubLoaderSingleton,
          buildNotifier(chromeApiSingleton),
          buildBadger(chromeApiSingleton)
        )
      }
    />
  </>,
  document.getElementById("root")
);
