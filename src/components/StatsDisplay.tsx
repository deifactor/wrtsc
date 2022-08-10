import { Level, StatId, STAT_NAME } from "../engine";

type Props = {
  kind: StatId;
  level: Level;
};

export const StatsDisplay = (props: Props) => {
  const { kind, level } = props;
  let levelDisplay = level.level.toString() + "%";
  const statPercent = Math.floor((100 * level.xp) / level.totalToNextLevel);
  return (
    <div>
      <strong>{STAT_NAME[kind]}</strong>: {levelDisplay} ({statPercent}%)
    </div>
  );
};
StatsDisplay.displayName = "StatsDisplay";
