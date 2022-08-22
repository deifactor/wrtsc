import React from "react";
import { ResourceId, RESOURCES } from "../engine";
import { useEngineSelector } from "../store";

type Props = {
  kind: ResourceId;
};

export const ResourceDisplay = React.memo((props: Props) => {
  const { kind } = props;
  const visible = useEngineSelector((engine) => engine.resources[kind].visible);
  const amount = useEngineSelector((engine) => engine.resources[kind].amount);
  if (!visible) {
    return null;
  }
  return (
    <div>
      <strong>{RESOURCES[kind].name}</strong>: {amount}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
