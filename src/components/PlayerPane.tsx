import React, { useCallback, useState } from "react";
import { SkillId } from "../engine/skills";
import { setPaused, startLoop } from "../worldStore";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";
import { Button } from "./common/Button";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressBar } from "./common/ProgressBar";
import { SkillIcon } from "./common/SkillIcon";
import classNames from "classnames";

// We have to explicitly write out the class names, otherwise PostCSS will
// "optimize" them out.
const SKILL_CLASS: Record<SkillId, string> = {
  ergodicity: "text-ergodicity",
  datalink: "text-datalink",
  spatial: "text-spatial",
  energyTransfer: "text-energy",
  metacognition: "text-metacognition",
  lethality: "text-lethality",
};

export const SkillDisplay = React.memo((props: { skillId: SkillId }) => {
  // Randomly offset the background image so it doesn't look weird.
  const [offsetX] = useState(Math.random() * 100);
  const { skillId } = props;
  const { xp, level, totalToNextLevel, visible } = useEngineSelector(
    (engine) => engine.skills[skillId]
  );
  if (!visible) {
    return null;
  }
  return (
    <div className={classNames("flex font-mono h-8", SKILL_CLASS[skillId])}>
      <SkillIcon id={skillId} className="flex-0 mr-3" size="2em" />
      <ProgressBar
        current={xp}
        max={totalToNextLevel}
        level={level.toString()}
        className="flex-grow h-full"
        backgroundPosition={`${100 * offsetX}%`}
      />
    </div>
  );
});

export const PlayerPane = React.memo(() => {
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
PlayerPane.displayName = "PlayerPane";
