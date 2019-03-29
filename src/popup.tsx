import React from "react";
import ReactDOM from "react-dom";
import Popup from "./components/Popup";
import "./popup.css";
import { store } from "./state/store";

ReactDOM.render(
  <Popup github={store.github} />,
  document.getElementById("root")
);
