import { ZoneKind, ZONES } from "../engine/zone";
import { ResourceDisplay } from "./ResourceDisplay";
import { ProgressDisplay } from "./ProgressDisplay";
import { ProgressView, ResourcesView } from "../viewModel";
import React from "react";

type Props = {
  zone: ZoneKind;
  progress: ProgressView;
  resources: ResourcesView;
  className?: string;
};

export const ZoneDisplay = React.memo((props: Props) => {
  const { progress: stats, resources, className } = props;
  const zone = ZONES[props.zone];

  const body = (() => {
    switch (zone.kind) {
      case "ruins":
        return (
          <div>
            <ProgressDisplay
              kind="ruinsExploration"
              {...stats.ruinsExploration}
            />
            <ProgressDisplay
              kind="patrolRoutesObserved"
              {...stats.patrolRoutesObserved}
            />
            <ResourceDisplay
              kind="ruinsBatteries"
              {...resources.ruinsBatteries}
            />
            <ResourceDisplay kind="ruinsWeapons" {...resources.ruinsWeapons} />
            <ProgressDisplay kind="qhLockout" {...stats.qhLockout} />
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
ZoneDisplay.displayName = "ZoneDisplay";
