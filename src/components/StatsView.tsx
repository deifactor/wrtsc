import { observer } from "mobx-react-lite";
import { Stats } from "../stats";

type Props = {
  stats: Stats;
};

export const StatsView = observer((props: Props) => {
  const { stats } = props;
  const statBlock = stats.statList().map((stat) => {
    const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
    return (
      <div key={stat.name}>
        <strong>{stat.name}</strong>: {stat.level} ({statPercent}% {stat.xp}/
        {stat.totalToNextLevel})
      </div>
    );
  });
  return (
    <div>
      <h3>Stats</h3>
      {statBlock}
    </div>
  );
});
