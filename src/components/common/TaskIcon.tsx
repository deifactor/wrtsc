import { TaskKind } from "../../task";
import { IconType } from "react-icons";
import {
  GiBatteryPack,
  GiJourney,
  GiLockPicking,
  GiSpaceship,
  GiSpyglass,
  GiTargeting,
} from "react-icons/gi";
import { FaVenusDouble } from "react-icons/fa";

// because it's funny to me
const DEBUG_ICON = FaVenusDouble;

export const ICONS: Partial<Record<TaskKind, IconType>> = {
  exploreRuins: GiTargeting,
  scavengeBatteries: GiBatteryPack,
  observePatrolRoutes: GiSpyglass,
  hijackShip: GiSpaceship,
  disableLockouts: GiLockPicking,
  leaveRuins: GiJourney,
  completeRuins: DEBUG_ICON,
};

type Props = {
  task: TaskKind;
  size?: string;
  className?: string;
};

export const TaskIcon = (props: Props) => {
  const { task, size, className } = props;
  const Icon = ICONS[task]!;
  return <Icon className={className} size={size || "1.5em"} />;
};
