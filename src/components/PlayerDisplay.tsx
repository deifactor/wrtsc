import React from "react";
import { useEngineSelector } from "../engineStore";
import { ResourceDisplay } from "./ResourceDisplay";

export const PlayerDisplay = React.memo(() => {
  const energy = useEngineSelector((engine) => engine.energy);
  const combat = useEngineSelector((engine) => engine.combat);
  return (
    <div>
      <div>
        <strong>AEU</strong>: {energy.toFixed(0)}
      </div>
      <ResourceDisplay kind="linkedSensorDrones" />
      <p>
        <strong>Combat:</strong> {combat}
      </p>
    </div>
  );
});
PlayerDisplay.displayName = "PlayerDisplay";
