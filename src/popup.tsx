import React from "react";
import ReactDOM from "react-dom";
import Popup from "./components/Popup";
import "./popup.css";
import { store } from "./state/store";

ReactDOM.render(
  <Popup gitHub={store.github} />,
  document.getElementById("root")
);
