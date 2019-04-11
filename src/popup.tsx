import { css, Global } from "@emotion/core";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import ReactDOM from "react-dom";
import { chromeApiSingleton } from "./chrome";
import { Popup } from "./components/Popup";
import { GitHubState } from "./state/github";
import { githubLoaderSingleton } from "./state/github-loader";
import { getStore } from "./state/storage/store";

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
      github={
        new GitHubState(
          chromeApiSingleton,
          getStore(chromeApiSingleton),
          githubLoaderSingleton
        )
      }
    />
  </>,
  document.getElementById("root")
);
