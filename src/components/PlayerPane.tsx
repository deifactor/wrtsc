import React, { useCallback, useState } from "react";
import { SkillId, SKILL_NAME, totalToNextSkillLevel } from "../engine/skills";
import { setPaused, setUseUnspentTime, startLoop } from "../worldStore";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";
import { Button } from "./common/Button";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressBar } from "./common/ProgressBar";
import { SkillIcon } from "./common/SkillIcon";
import classNames from "classnames";
import prettyMilliseconds from "pretty-ms";
import { getCombat, getDefense, getMaxHp } from "../engine/combat";
import { GiBatteryPack, GiHealthNormal } from "react-icons/gi";
import { CardTooltip, WithTooltip } from "./common/Tooltip";

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

const SKILL_DESCRIPTION: Record<SkillId, string> = {
  ergodicity:
    "Your ability to move randomly and to uncover the unknown. Boosts all progress-type skills (i.e., those that fill a meter to 100%).",
  datalink:
    "Communication with non-sentient electronic systems. Boosts actions involving hacking and similar things.",
  spatial:
    "Awareness of the position of your chassis and other objects around you. Boosts defense.",
  energyTransfer:
    "Awareness of your internal battery's charging characteristics. Increases energy gain from all sources.",
  metacognition:
    "Optimizing your own thinking. Increases XP gain for all skills, and trained whenever any other skill is trained.",
  lethality:
    "You are a weapon as yet unforged. Hone yourself. Increases offense.",
};

export const SkillDisplay = React.memo((props: { skillId: SkillId }) => {
  // Randomly offset the background image so it doesn't look weird.
  const [offsetX] = useState(Math.random() * 100);
  const { skillId } = props;
  const { xp, level } = useEngineSelector((engine) => engine.skills[skillId]);
  const totalToNextLevel = totalToNextSkillLevel({ xp, level });

  const text = `${level} (${scientific.format(xp)}/${scientific.format(
    totalToNextLevel
  )})`;
  return (
    <WithTooltip
      tooltip={
        <CardTooltip title={SKILL_NAME[skillId]}>
          {SKILL_DESCRIPTION[skillId]}
        </CardTooltip>
      }
      render={(ref) => (
        <div
          className={classNames("flex font-mono h-8", SKILL_CLASS[skillId])}
          ref={ref}
        >
          <SkillIcon id={skillId} className="flex-0 mr-3" size="2em" />
          <ProgressBar
            current={xp}
            max={totalToNextLevel}
            text={text}
            className="flex-grow h-full"
            backgroundPosition={`${100 * offsetX}%`}
          />
        </div>
      )}
    />
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
  const totalEnergy = useEngineSelector((engine) => engine.totalEnergy);
  const combat = useEngineSelector((engine) => getCombat(engine).toFixed(0));
  const defense = useEngineSelector((engine) => getDefense(engine).toFixed(0));
  const currentHp = useEngineSelector((engine) => engine.currentHp);
  const maxHp = useEngineSelector(getMaxHp);
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
      <h2>Time</h2>
      <TimeStats />
      <div className="mt-2">
        <Button onClick={() => dispatch(startLoop())}>Restart Loop</Button>
        <Button onClick={togglePause}>{isPaused ? "Play" : "Pause"}</Button>
        <Button onClick={toggleUnspentTime}>
          {useUnspentTime ? "Disable" : "Enable"} Unspent Time
        </Button>
      </div>
      <hr className="mx-3 my-2 border-gray-800" />
      <h2>Vitals</h2>
      <div className="flex font-mono h-8 text-yellow-300">
        <GiBatteryPack className="flex-0 mr-3" size="1.5em" />
        <ProgressBar
          current={energy}
          max={totalEnergy}
          text={energy.toFixed(0)}
          className="h-full flex-grow"
        />
      </div>
      <div className="flex font-mono h-8 text-green-300">
        <GiHealthNormal className="flex-0 mr-3" size="1.5em" />
        <ProgressBar
          current={currentHp}
          max={maxHp}
          text={`${currentHp.toFixed(0)} / ${maxHp.toFixed(0)}`}
          className="h-full flex-grow"
        />
      </div>
      <hr className="mx-3 my-2 border-gray-800" />
      <h2>Stats</h2>
      <p>
        <strong>Combat:</strong> {combat}
      </p>
      <p>
        <strong>Defense:</strong> {defense}
      </p>
      <p>
        <strong>Simulant XP:</strong> {simulantXp.toFixed(0)}
      </p>
      <ResourceDisplay id="matter" />
      <hr className="mx-3 my-2 border-gray-800" />
      <h2>Skills</h2>
      <SkillDisplay skillId="ergodicity" />
      <SkillDisplay skillId="datalink" />
      <SkillDisplay skillId="lethality" />
      <SkillDisplay skillId="spatial" />
      <SkillDisplay skillId="energyTransfer" />
      <SkillDisplay skillId="metacognition" />
    </div>
  );
});
PlayerPane.displayName = "PlayerPane";
