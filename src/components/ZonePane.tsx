import { ZONES } from "../engine/zone";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressDisplay } from "./ProgressDisplay";
import { useEngineSelector } from "../store";

type Props = {
  className?: string;
};

export const ZonePane = (props: Props) => {
  const zone = ZONES[useEngineSelector((engine) => engine.zoneKind)];
  const { className } = props;

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <ProgressDisplay kind="ruinsExploration" />
            <ProgressDisplay kind="patrolRoutesObserved" />
            <ProgressDisplay kind="qhLockout" />
            <ResourceDisplay kind="ruinsBatteries" />
            <ResourceDisplay kind="teracapacitors" />
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
ZonePane.displayName = "ZonePane";
