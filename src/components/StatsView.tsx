import { observer } from "mobx-react-lite";
import { Player, StatId, STAT_NAME } from "../player";

type Props = {
  kind: StatId;
  player: Player;
};

export const StatView = observer((props: Props) => {
  const { kind, player } = props;
  const stat = player.stats[kind];
  let levelDisplay = stat.level.toString() + "%";
  debugger;
  const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
  return (
    <div>
      <strong>{STAT_NAME[kind]}</strong>: {levelDisplay} ({statPercent}%)
    </div>
  );
});
StatView.displayName = "StatView";
