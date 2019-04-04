import { observer } from "mobx-react";
import React, { Component } from "react";
import { ClipLoader } from "react-spinners";
import { Center } from "./design/Center";

@observer
export class Loader extends Component<{}> {
  render() {
    return (
      <Center>
        <ClipLoader />
      </Center>
    );
  }
}
