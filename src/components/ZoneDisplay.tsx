import { Player } from "../player";
import { ResourceDisplay } from "./ResourceDisplay";
import { StatsDisplay } from "./StatsDisplay";

type Props = {
  player: Player;
  className?: string;
};

export const ZoneDisplay = (props: Props) => {
  const { player, className } = props;
  const { zone } = player;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <StatsDisplay kind="ruinsExploration" player={player} />
            <StatsDisplay kind="patrolRoutesObserved" player={player} />
            <ResourceDisplay kind="ruinsBatteries" player={player} />
            <ResourceDisplay kind="ruinsWeapons" player={player} />
            <StatsDisplay kind="qhLockout" player={player} />
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
};
ZoneDisplay.displayName = "ZoneDisplay";
