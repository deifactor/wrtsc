import { ZONES } from "../engine/zone";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressDisplay } from "./ProgressDisplay";
import { useEngineSelector } from "../store";

type Props = {
  className?: string;
};

export const ZonePane = (props: Props) => {
  const zone = ZONES[useEngineSelector((engine) => engine.zoneId)];
  const { className } = props;

  const body = (() => {
    switch (zone.id) {
      case "ruins":
        return (
          <div>
            <ProgressDisplay id="ruinsExploration" />
            <ProgressDisplay id="patrolRoutesObserved" />
            <ProgressDisplay id="qhLockout" />
            <ResourceDisplay id="unlinkedSensorDrones" />
            <ResourceDisplay id="linkedSensorDrones" />
            <ResourceDisplay id="qhLockoutAttempts" />
            <ResourceDisplay id="ruinsBatteries" />
            <ResourceDisplay id="teracapacitors" />
            <ResourceDisplay id="scouts" />
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
