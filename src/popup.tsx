import { css, Global } from "@emotion/core";
import React from "react";
import ReactDOM from "react-dom";
import { Popup } from "./components/Popup";
import { store } from "./state/store";

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
    <Popup github={store.github} />
  </>,
  document.getElementById("root")
);
