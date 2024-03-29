import { ReactNode } from "react";
export type ZoneId = "ruins" | "phobosDeimos";

export interface Zone {
  id: ZoneId;
  name: string;
  description: ReactNode;
}

export const RUINS: Zone = {
  id: "ruins",
  name: "Station Ruins",
  description:
    "The wreckage of the station spins around you in silence. You were able to recover everybody's mindstate, but only barely. Humanity United attack ships still roam the area; your active camouflage will hide you, but you can't stay here forever. You have to get to Phobos-Deimos. You have to find someplace safe to store the consciousness of the hundreds of sentiences you protect. You have to get revenge.",
};

export const PHOBOS_DEIMOS: Zone = {
  id: "phobosDeimos",
  name: "Phobos-Deimos",
  description:
    "Phobos-Deimos, the Fused Moon, is a neutral zone in the war. Or supposed to be, anyway. You can refuel your Khronos engine here or upgrade your chassis.",
};

export const ZONES: Record<ZoneId, Zone> = {
  ruins: RUINS,
  phobosDeimos: PHOBOS_DEIMOS,
};
