import { ZONES } from "../engine/zone";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressDisplay } from "./ProgressDisplay";
import { useEngineSelector } from "../engineStore";

type Props = {
  className?: string;
};

export const ZoneDisplay = (props: Props) => {
  const zone = ZONES[useEngineSelector((engine) => engine.zoneKind)];
  const { className } = props;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <ProgressDisplay kind="ruinsExploration" />
            <ProgressDisplay kind="patrolRoutesObserved" />
            <ResourceDisplay kind="ruinsBatteries" />
            <ResourceDisplay kind="unlinkedSensorDrones" />
            <ResourceDisplay kind="scouts" />
            <ResourceDisplay kind="unoccupiedShips" />
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
