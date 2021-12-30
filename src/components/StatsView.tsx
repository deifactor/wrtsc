import { observer } from "mobx-react-lite";
import { Stat } from "../player";

type Props = {
  stats: Stat[];
};

export const StatsView = observer((props: Props) => {
  const { stats } = props;
  const statBlock = stats.map((stat) => {
    const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
    return (
      <div key={stat.name}>
        <strong>{stat.name}</strong>: {stat.level} ({statPercent}% {stat.xp}/
        {stat.totalToNextLevel})
      </div>
    );
  });
  return <div>{statBlock}</div>;
});
