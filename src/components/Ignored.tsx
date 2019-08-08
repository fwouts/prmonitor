import styled from "@emotion/styled";
import { observer } from "mobx-react-lite";
import React from "react";
import { Card } from "react-bootstrap";
import { Core } from "../state/core";
import { Header } from "./design/Header";

export interface IgnoredProps {
  core: Core;
}

const Item = styled.div``;

const Label = styled.span``;

const Remove = styled.a``;

export const Ignored = observer((props: IgnoredProps) => {
  const ignored = props.core.muteConfiguration.ignored || {};
  if (Object.keys(ignored).length === 0) {
    return <></>;
  }
  return (
    <>
      <Header>Ignored repositories</Header>
      <Card>
        {Object.entries(ignored).map(([owner, config]) => (
          <Item>
            <Label>
              {config.kind === "ignore-all"
                ? `${owner}/*`
                : config.repoNames.map(repo => `${owner}/${repo}`).join(", ")}
            </Label>
            <Remove>+</Remove>
          </Item>
        ))}
      </Card>
    </>
  );
});
