import { css, Global } from "@emotion/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faBan } from "@fortawesome/free-solid-svg-icons/faBan";
import { faBell } from "@fortawesome/free-solid-svg-icons/faBell";
import { faBellSlash } from "@fortawesome/free-solid-svg-icons/faBellSlash";
import { faClock } from "@fortawesome/free-solid-svg-icons/faClock";
import { faClone } from "@fortawesome/free-solid-svg-icons/faClone";
import { faPen } from "@fortawesome/free-solid-svg-icons/faPen";
import { faPodcast } from "@fortawesome/free-solid-svg-icons/faPodcast";
import { faReply } from "@fortawesome/free-solid-svg-icons/faReply";
import "bootstrap/dist/css/bootstrap.min.css";
import React from "react";
import ReactDOM from "react-dom";
import { chromeApiSingleton } from "./chrome/implementation";
import { Popup } from "./components/Popup";
import { buildEnvironment } from "./environment/implementation";
import { Core } from "./state/core";

library.add(faBan);
library.add(faBell);
library.add(faBellSlash);
library.add(faClock);
library.add(faPodcast);
library.add(faReply);
library.add(faPen);
library.add(faClone);

const env = buildEnvironment(chromeApiSingleton);
const core = new Core(env);
core.load().catch(console.error);

let globalCssTemplates = `
  @import url("https://fonts.googleapis.com/css?family=Roboto");

  body {
    background: #f6f8fc;
    color: #444;
    margin: 0 auto;
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
`;

// Temporary workaround for secondary monitors on MacOS where redraws don't happen
// TODO: Remove once Chromium fixes bug.
// Ref: https://stackoverflow.com/questions/56500742/why-is-my-google-chrome-extensions-popup-ui-laggy-on-external-monitors-but-not/64113061#64113061
// @See https://bugs.chromium.org/p/chromium/issues/detail?id=971701
const isSecondMonitor =
  window.screenLeft < 0 ||
  window.screenTop < 0 ||
  window.screenLeft > window.screen.width ||
  window.screenTop > window.screen.height;
if (isSecondMonitor) {
  globalCssTemplates += `
    @keyframes redraw {
      0% {
        opacity: 1;
      }
      100% {
        opacity: 0.99;
      }
    }
    html {
      animation: redraw 1s linear infinite;
    }
  `;
}

ReactDOM.render(
  <>
    <Global styles={css(globalCssTemplates)} />
    <Popup core={core} />
  </>,
  document.getElementById("root")
);
