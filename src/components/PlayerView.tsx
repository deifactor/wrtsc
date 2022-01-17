import { observer } from "mobx-react-lite";
import { Player } from "../player";

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
      <p>
        <strong>Combat:</strong> {player.combat}
      </p>
    </div>
  );
});
