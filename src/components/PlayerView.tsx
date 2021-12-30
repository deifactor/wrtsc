import { observer } from "mobx-react-lite";
import { Player, Stat } from "../player";
import { StatView } from "./StatsView";

type Props = {
  player: Player;
};

export const PlayerView = observer((props: Props) => {
  const { player } = props;
  return (
    <div>
      <div>
        <strong>AEU</strong>: {player.energy.toFixed(0)}
      </div>
      <StatView stat={player.stats.combat} />
    </div>
  );
});
