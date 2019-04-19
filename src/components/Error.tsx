import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";

export interface ErrorProps {
  lastError: string | null;
}

const ErrorContainer = styled.p`
  border: 1px solid #d00;
  background: #fdd;
  color: #400;
  padding: 8px;
`;

export const Error = observer((props: ErrorProps) => {
  if (!props.lastError) {
    return <></>;
  }
  return <ErrorContainer>Error: {props.lastError}</ErrorContainer>;
});
