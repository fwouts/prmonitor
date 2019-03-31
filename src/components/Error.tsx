import styled from "@emotion/styled";
import { observer } from "mobx-react";
import React, { Component } from "react";

export interface ErrorProps {
  lastError: string | null;
}

const ErrorContainer = styled.p`
  border: 1px solid #d00;
  background: #fdd;
  color: #400;
  padding: 8px;
`;

@observer
export class Error extends Component<ErrorProps> {
  render() {
    if (!this.props.lastError) {
      return <></>;
    }
    return <ErrorContainer>Error: {this.props.lastError}</ErrorContainer>;
  }
}
