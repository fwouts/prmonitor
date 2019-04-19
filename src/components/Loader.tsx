import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { ClipLoader } from "react-spinners";
import { Center } from "./design/Center";

const PaddedCenter = styled(Center)`
  padding: 16px;
`;

@observer
export class Loader extends Component<{}> {
  render() {
    return (
      <PaddedCenter>
        <ClipLoader />
      </PaddedCenter>
    );
  }
}
