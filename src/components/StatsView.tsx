import { observer } from "mobx-react-lite";
import { Stat } from "../player";

type Props = {
  stat: Stat;
};

export const StatView = observer((props: Props) => {
  const { stat } = props;
  let levelDisplay;
  switch (stat.kind) {
    case "normal":
      levelDisplay = stat.level.toString();
      break;
    case "progress":
      levelDisplay = stat.level.toString() + "%";
  }
  const statPercent = Math.floor((100 * stat.xp) / stat.totalToNextLevel);
  return (
    <div>
      <strong>{stat.name}</strong>: {levelDisplay} ({statPercent}%)
    </div>
  );
});
StatView.displayName = "StatView";
