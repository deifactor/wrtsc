import { observer } from "mobx-react-lite";
import { Player } from "../player";
import { ResourceView } from "./ResourceView";
import { StatView } from "./StatsView";

type Props = {
  player: Player;
  className?: string;
};

export const ZoneView = observer((props: Props) => {
  const { player, className } = props;
  const { zone } = player;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <StatView kind="ruinsExploration" player={player} />
            <StatView kind="patrolRoutesObserved" player={player} />
            <ResourceView kind="ruinsBatteries" player={player} />
            <ResourceView kind="ruinsWeapons" player={player} />
            <StatView kind="qhLockout" player={player} />
          </div>
        );
    }
  })();

  return (
    <div className={className}>
      <h2>{zone.name}</h2>
      {body}
      <hr className="border-gray-800 mx-3 my-4" />
      <p className="text-gray-400">{zone.description}</p>
    </div>
  );
});
ZoneView.displayName = "ZoneView";
