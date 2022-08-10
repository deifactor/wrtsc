import { Player, StatId, STAT_NAME } from "../engine";

type Props = {
  kind: StatId;
  player: Player;
};

export const StatsDisplay = (props: Props) => {
  const { kind, player } = props;
  const stat = player.stats[kind];
  let levelDisplay = stat.level.toString() + "%";
  const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
  return (
    <div>
      <strong>{STAT_NAME[kind]}</strong>: {levelDisplay} ({statPercent}%)
    </div>
  );
};
StatsDisplay.displayName = "StatsDisplay";
