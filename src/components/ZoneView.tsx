import { observer } from "mobx-react-lite";
import { Player } from "../player";
import { ResourceView } from "./ResourceView";
import { StatView } from "./StatsView";

type Props = {
  player: Player;
  className?: string;
};

export const ZoneView = observer((props: Props) => {
  const {
    player: { stats, resources, zone },
    className,
  } = props;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <StatView stat={stats.ruinsExploration}></StatView>
            <StatView stat={stats.patrolRoutesObserved}></StatView>
            <ResourceView resource={resources.ruinsBatteries}></ResourceView>
            <ResourceView resource={resources.ruinsWeapons}></ResourceView>
            <StatView stat={stats.qhLockout}></StatView>
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
