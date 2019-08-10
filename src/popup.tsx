import { css, Global } from "@emotion/core";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons/faBellSlash";
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom";
import { chromeApiSingleton } from "./chrome/implementation";
import { Popup } from "./components/Popup";
import { buildEnvironment } from "./environment/implementation";
import { Core } from "./state/core";

library.add(faBell);
library.add(faBellSlash);

const env = buildEnvironment(chromeApiSingleton);
const core = new Core(env);
core.load().catch(console.error);

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
          width: 600px;
          font-family: Roboto, sans-serif;
          font-size: 14px;
        }

        a {
          color: #000;
        }

        .nav-tabs {
          border-bottom: none;
        }
      `}
    />
    <Popup core={core} />
  </>,
  document.getElementById("root")
);
