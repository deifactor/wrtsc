import React from "react";
import { ResourceId, RESOURCES } from "../engine";
import { useEngineSelector } from "../engineStore";

type Props = {
  kind: ResourceId;
};

export const ResourceDisplay = React.memo((props: Props) => {
  const { kind } = props;
  const amount = useEngineSelector((engine) => engine.resources[kind].amount);
  return (
    <div>
      <strong>{RESOURCES[kind].name}</strong>: {amount}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
