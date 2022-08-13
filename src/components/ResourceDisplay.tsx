import React from "react";
import { ResourceId, RESOURCE_NAME } from "../engine";
import { useEngineSelector } from "../engineStore";

type Props = {
  kind: ResourceId;
};

export const ResourceDisplay = React.memo((props: Props) => {
  const { kind } = props;
  const { amount, max } = useEngineSelector((engine) => engine.resources[kind]);
  return (
    <div>
      <strong>{RESOURCE_NAME[kind]}</strong>: {amount}/{max}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
