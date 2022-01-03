import { observer } from "mobx-react-lite";
import { Player } from "../player";
import { Zone, ZoneKind } from "../zone";
import { ResourceView } from "./ResourceView";
import { StatView } from "./StatsView";

type Props = {
  zone: Zone;
  player: Player;
  className?: string;
};

export const ZoneView = observer((props: Props) => {
  const {
    zone,
    player: { stats, resources },
    className,
  } = props;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <StatView stat={stats.ruinsExploration}></StatView>
            <ResourceView resource={resources.ruinsBatteries}></ResourceView>
            <ResourceView resource={resources.ruinsWeapons}></ResourceView>
          </div>
        );
    }
  })();

  return (
    <div className={className}>
      <h1>Location</h1>
      <h2>{zone.name}</h2>
      {body}
      <hr className="border-gray-800 mx-3 my-4" />
      <p className="text-gray-400">{zone.description}</p>
    </div>
  );
});
