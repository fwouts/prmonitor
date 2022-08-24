import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";

export interface NewCommitsToggleProps {
  toggled: boolean;
  onToggle(): void;
}

export const NewCommitsToggle = observer((props: NewCommitsToggleProps) => {
  return (
    <Container>
      <NewCommitsCheckbox
        type="checkbox"
        checked={props.toggled}
        onChange={props.onToggle}
      />
      Include new commits
    </Container>
  );
});

const Container = styled.label`
  padding: 8px;
  margin: 0;
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const NewCommitsCheckbox = styled.input`
  margin-right: 8px;
`;
