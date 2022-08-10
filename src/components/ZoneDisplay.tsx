import { Level, ResourceId, StatId } from "../engine";
import { ZoneKind, ZONES } from "../engine/zone";
import { ResourceDisplay } from "./ResourceDisplay";
import { StatsDisplay } from "./StatsDisplay";

type Props = {
  zone: ZoneKind;
  stats: Record<StatId, Level>;
  resources: Record<ResourceId, number>;
  className?: string;
};

export const ZoneDisplay = (props: Props) => {
  const { stats, resources, className } = props;
  const zone = ZONES[props.zone];

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <StatsDisplay
              kind="ruinsExploration"
              level={stats.ruinsExploration}
            />
            <StatsDisplay
              kind="patrolRoutesObserved"
              level={stats.patrolRoutesObserved}
            />
            <ResourceDisplay
              kind="ruinsBatteries"
              amount={resources.ruinsBatteries}
              max={9999}
            />
            <ResourceDisplay
              kind="ruinsWeapons"
              amount={resources.ruinsWeapons}
              max={9999}
            />
            <StatsDisplay kind="qhLockout" level={stats.qhLockout} />
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
