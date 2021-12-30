import { ReactNode } from "react";
import { StatName } from "./player";
import {
  Task,
  EXPLORE_RUINS,
  SCAVENGE_BATTERIES,
  SCAVENGE_WEAPONS,
} from "./task";
export type ZoneKind = "ruins";

export interface Zone {
  kind: ZoneKind;
  name: string;
  description: ReactNode;
  tasks: Task[];
  progressStats: StatName[];
}

export const RUINS: Zone = {
  kind: "ruins",
  name: "Station Ruins",
  description:
    "The wreckage of the station spins around you in silence. You were able to recover everybody's mindstate, but only barely. Humanity United attack ships still roam the area; your active camouflage will hide you, but you can't stay here forever. You have to get to Phobos-Deimos. You have to find someplace safe to store the consciousness of the hundreds of sentiences you protect. You have to get revenge.",
  tasks: [EXPLORE_RUINS, SCAVENGE_BATTERIES, SCAVENGE_WEAPONS],
  progressStats: ["ruinsExploration"],
};
