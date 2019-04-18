import { css, Global } from "@emotion/core";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons";
import React from "react";
import ReactDOM from "react-dom";
import { chromeApiSingleton } from "./chrome/implementation";
import { Popup } from "./components/Popup";
import { buildEnvironment } from "./environment/implementation";
import { Core } from "./state/core";

library.add(faBellSlash);

const env = buildEnvironment(chromeApiSingleton);

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
    <Popup core={new Core(env)} />
  </>,
  document.getElementById("root")
);
