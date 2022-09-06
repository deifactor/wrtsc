import React, { useCallback } from "react";
import { SkillId, SKILL_NAME } from "../engine/skills";
import { setPaused, startLoop } from "../worldStore";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";
import { Button } from "./common/Button";
import { ResourceDisplay } from "./ResourceDisplay";

export const SkillDisplay = React.memo((props: { skillId: SkillId }) => {
  const { skillId } = props;
  const { xp, level, totalToNextLevel, visible } = useEngineSelector(
    (engine) => engine.skills[skillId]
  );
  if (!visible) {
    return null;
  }
  const skillPercent = ((100 * xp) / totalToNextLevel).toFixed(1);
  return (
    <div>
      <strong>{SKILL_NAME[skillId]}</strong>: {level} ({skillPercent}
      %)
    </div>
  );
});

export const PlayerDisplay = React.memo(() => {
  const dispatch = useAppDispatch();
  const energy = useEngineSelector((engine) => engine.energy);
  const combat = useEngineSelector((engine) => engine.combat);
  const totalTime = useEngineSelector((engine) => engine.timeAcrossAllLoops);
  const bonusTime = useAppSelector((state) => state.world.unspentTime);
  const isPaused = useAppSelector((state) => state.world.paused);
  const simulantXp = useEngineSelector((engine) => engine.simulant.freeXp);
  const togglePause = useCallback(
    () => dispatch(setPaused(!isPaused)),
    [dispatch, isPaused]
  );
  return (
    <div>
      <h1>Stats</h1>
      <div>
        <strong>AEU</strong>: {energy.toFixed(0)}
      </div>
      <div>
        <strong>T_total</strong>: {(totalTime / 1000).toFixed(0)}
      </div>
      <div>
        <strong>Bonus</strong>: {bonusTime.toFixed(0)}
      </div>
      <ResourceDisplay kind="linkedSensorDrones" />
      <ResourceDisplay kind="qhLockoutAttempts" />
      <ResourceDisplay kind="weaponSalvage" />
      <p>
        <strong>Combat:</strong> {combat}
      </p>
      <p>
        <strong>Simulant XP:</strong> {simulantXp.toFixed(0)}
      </p>
      <hr className="mx-3 my-4 border-gray-800" />
      <SkillDisplay skillId="ergodicity" />
      <SkillDisplay skillId="datalink" />
      <SkillDisplay skillId="lethality" />
      <SkillDisplay skillId="spatial" />
      <SkillDisplay skillId="energyTransfer" />
      <SkillDisplay skillId="metacognition" />
      <Button onClick={() => dispatch(startLoop())}>Restart Loop</Button>
      <Button onClick={togglePause}>{isPaused ? "Play" : "Pause"}</Button>
    </div>
  );
});
PlayerDisplay.displayName = "PlayerDisplay";
