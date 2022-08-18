import { TaskKind } from "../../engine";
import { IconType } from "react-icons";
import {
  GiBatteryPack,
  GiHoodedAssassin,
  GiJourney,
  GiLockPicking,
  GiSpaceship,
  GiSpyglass,
  GiStrafe,
  GiTargeting,
} from "react-icons/gi";
import { SiDrone } from "react-icons/si";
import { FaVenusDouble, FaWrench } from "react-icons/fa";
import React from "react";

// because it's funny to me
const DEBUG_ICON = FaVenusDouble;

export const ICONS: Partial<Record<TaskKind, IconType>> = {
  exploreRuins: GiTargeting,
  scavengeBatteries: GiBatteryPack,
  observePatrolRoutes: GiSpyglass,
  hijackShip: GiSpaceship,
  disableLockouts: GiLockPicking,
  leaveRuins: GiJourney,
  linkSensorDrones: SiDrone,
  eradicateScout: GiHoodedAssassin,
  strafingRun: GiStrafe,
  dismantleSensorDrones: FaWrench,
  completeRuins: DEBUG_ICON,
};

type Props = {
  task: TaskKind;
  size?: string;
  className?: string;
};

export const TaskIcon = React.memo((props: Props) => {
  const { task, size, className } = props;
  const Icon = ICONS[task]!;
  return <Icon className={className} size={size || "1.5em"} />;
});
TaskIcon.displayName = "TaskIcon";
