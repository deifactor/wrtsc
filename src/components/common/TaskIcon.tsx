import { TaskKind } from "../../task";
import { IconType } from "react-icons";
import {
  GiBatteryPack,
  GiJourney,
  GiLaserBlast,
  GiLockPicking,
  GiSpaceship,
  GiSpyglass,
  GiTargeting,
} from "react-icons/gi";

export const ICONS: Partial<Record<TaskKind, IconType>> = {
  exploreRuins: GiTargeting,
  scavengeBatteries: GiBatteryPack,
  scavengeWeapons: GiLaserBlast,
  observePatrolRoutes: GiSpyglass,
  hijackShip: GiSpaceship,
  disableLockouts: GiLockPicking,
  leaveRuins: GiJourney,
};

type Props = {
  task: TaskKind;
  size?: string
  className?: string;
};

export const TaskIcon = (props: Props) => {
  const { task, size, className} = props;
  const Icon = ICONS[task]!;
  return <Icon className={className} size={size || "1.5em"} />;
};
