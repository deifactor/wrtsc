import React from "react";
import { startLoop } from "../engineStore";
import { useAppDispatch, useEngineSelector } from "../store";
import { Button } from "./common/Button";
import { ResourceDisplay } from "./ResourceDisplay";

export const PlayerDisplay = React.memo(() => {
  const dispatch = useAppDispatch();
  const energy = useEngineSelector((engine) => engine.energy);
  const combat = useEngineSelector((engine) => engine.combat);
  return (
    <div>
      <h1>Stats</h1>
      <div>
        <strong>AEU</strong>: {energy.toFixed(0)}
      </div>
      <ResourceDisplay kind="linkedSensorDrones" />
      <ResourceDisplay kind="qhLockoutAttempts" />
      <ResourceDisplay kind="weaponSalvage" />
      <p>
        <strong>Combat:</strong> {combat}
      </p>
      <hr className="mx-3 my-4 border-gray-800" />
      <Button onClick={() => dispatch(startLoop())}>Restart Loop</Button>
    </div>
  );
});
PlayerDisplay.displayName = "PlayerDisplay";
