import React from "react";
import { ResourceId, RESOURCES } from "../engine";
import { useEngineViewSelector } from "../store";

type Props = {
  id: ResourceId;
};

export const ResourceDisplay = React.memo((props: Props) => {
  const { id } = props;
  const visible = useEngineViewSelector(
    (engine) => engine.resources[id].visible
  );
  const amount = useEngineViewSelector((engine) => engine.resources[id].amount);
  if (!visible) {
    return null;
  }
  return (
    <div>
      <strong>{RESOURCES[id].name}</strong>: {amount}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
