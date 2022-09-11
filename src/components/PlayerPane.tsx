import React, { useCallback, useState } from "react";
import { SkillId } from "../engine/skills";
import { setPaused, setUseUnspentTime, startLoop } from "../worldStore";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";
import { Button } from "./common/Button";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressBar } from "./common/ProgressBar";
import { SkillIcon } from "./common/SkillIcon";
import classNames from "classnames";
import prettyMilliseconds from "pretty-ms";

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

const scientific = Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

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

  const text = `${level} (${scientific.format(xp)}/${scientific.format(
    totalToNextLevel
  )})`;
  return (
    <div className={classNames("flex font-mono h-8", SKILL_CLASS[skillId])}>
      <SkillIcon id={skillId} className="flex-0 mr-3" size="2em" />
      <ProgressBar
        current={xp}
        max={totalToNextLevel}
        text={text}
        className="flex-grow h-full"
        backgroundPosition={`${100 * offsetX}%`}
      />
    </div>
  );
});

/** We move this into its own component because it's potentially updating quite a bit. */
const TimeStats = React.memo(() => {
  const options = { secondsDecimalDigits: 0 };
  const totalTime = useEngineSelector((engine) =>
    prettyMilliseconds(engine.timeAcrossAllLoops, options)
  );
  const bonusTime = useAppSelector((state) =>
    prettyMilliseconds(state.world.unspentTime, options)
  );

  return (
    <>
      <div>
        <strong>Total time</strong>: {totalTime}
      </div>
      <div>
        <strong>Bonus time</strong>: {bonusTime}
      </div>
    </>
  );
});

export const PlayerPane = React.memo(() => {
  const dispatch = useAppDispatch();
  const energy = useEngineSelector((engine) => engine.energy);
  const combat = useEngineSelector((engine) => engine.combat.toFixed(0));
  const defense = useEngineSelector((engine) => engine.defense.toFixed(0));
  const currentHp = useEngineSelector((engine) => engine.currentHp.toFixed(0));
  const maxHp = useEngineSelector((engine) => engine.maxHp);
  const isPaused = useAppSelector((state) => state.world.paused);
  const simulantXp = useEngineSelector((engine) => engine.simulant.freeXp);
  const useUnspentTime = useAppSelector((state) => state.world.useUnspentTime);
  const togglePause = useCallback(
    () => dispatch(setPaused(!isPaused)),
    [dispatch, isPaused]
  );
  const toggleUnspentTime = useCallback(
    () => dispatch(setUseUnspentTime(!useUnspentTime)),
    [dispatch, useUnspentTime]
  );
  return (
    <div>
      <h1>Stats</h1>
      <div>
        <strong>AEU</strong>: {energy.toFixed(0)}
      </div>
      <ResourceDisplay id="linkedSensorDrones" />
      <ResourceDisplay id="qhLockoutAttempts" />
      <ResourceDisplay id="weaponSalvage" />
      <p>
        <strong>Combat:</strong> {combat}
      </p>
      <p>
        <strong>Defense:</strong> {defense}
      </p>
      <p>
        <strong>HP:</strong> {currentHp}/{maxHp}
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
      <Button onClick={toggleUnspentTime}>
        {useUnspentTime ? "Disable" : "Enable"} Unspent Time
      </Button>
      <hr className="mx-3 my-4 border-gray-800" />
      <TimeStats />
    </div>
  );
});
PlayerPane.displayName = "PlayerPane";
