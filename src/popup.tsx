import { css, Global } from "@emotion/core";
import React from "react";
import ReactDOM from "react-dom";
import { Popup } from "./components/Popup";
import { store } from "./state/store";

ReactDOM.render(
  <>
    <Global
      styles={css`
        body {
          margin: 0;
          padding: 8px;
          min-width: 400px;
          font-family: sans-serif;
          font-size: 14px;
          color: #222;
        }
      `}
    />
    <Popup github={store.github} />
  </>,
  document.getElementById("root")
);
