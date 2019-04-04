import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";
import { ClipLoader } from "react-spinners";

const Center = styled.div`
  display: flex;
  justify-content: center;
`;

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
