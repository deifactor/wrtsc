import { observer } from "mobx-react-lite";
import { Stat } from "../player";

type Props = {
  stats: Stat[];
  className?: string;
};

export const StatsView = observer((props: Props) => {
  const { stats, className } = props;
  const statBlock = stats.map((stat) => {
    const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
    return (
      <div key={stat.name}>
        <strong>{stat.name}</strong>: {stat.level} ({statPercent}% {stat.xp}/
        {stat.totalToNextLevel})
      </div>
    );
  });
  return (
    <div className={className}>
      <h1>Stats</h1>
      {statBlock}
    </div>
  );
});
