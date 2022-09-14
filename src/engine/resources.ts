import { Engine } from "./engine";
import { ZoneId } from "./zone";

export const RESOURCE_IDS = [
  "ruinsBatteries",
  "unlinkedSensorDrones",
  "teracapacitors",
  "linkedSensorDrones",
  "scouts",
  "qhLockoutAttempts",
  // 'Matter' is something the player can use to augment their abilities.
  "matter",
  "weaponizedMatter",
] as const;
export type ResourceId = typeof RESOURCE_IDS[number];

export type Resource = {
  id: ResourceId;
  name: string;
  /** The zone the resource is associated with. If null, associated with the player. */
  zone: ZoneId | null;
  initial: (engine: Engine) => number;
};

export const RESOURCES: Record<ResourceId, Resource> = {
  ruinsBatteries: {
    id: "ruinsBatteries",
    name: "Intact Batteries",
    zone: "ruins",
    initial: (engine) => Math.floor(engine.progress.ruinsExploration.level / 2),
  },
  teracapacitors: {
    id: "teracapacitors",
    name: "Functioning Teracapacitors",
    zone: "ruins",
    // Available at 25, 75.
    initial: (engine) =>
      Math.floor(engine.progress.ruinsExploration.level / 80),
  },
  unlinkedSensorDrones: {
    id: "unlinkedSensorDrones",
    name: "Unlinked Sensor Drones",
    zone: "ruins",
    initial: (engine) =>
      Math.floor(engine.progress.ruinsExploration.level / 10),
  },
  linkedSensorDrones: {
    id: "linkedSensorDrones",
    name: "Linked Sensor Drones",
    zone: "ruins",
    initial: () => 0,
  },
  scouts: {
    id: "scouts",
    name: "Preserver Scouts Located",
    zone: "ruins",
    initial: (engine) =>
      Math.floor(engine.progress.patrolRoutesObserved.level / 6),
  },
  qhLockoutAttempts: {
    id: "qhLockoutAttempts",
    name: "QH Lockout Attempts",
    zone: "ruins",
    initial: () => 0,
  },
  matter: {
    id: "matter",
    name: "Matter",
    zone: null,
    initial: () => 0,
  },
  weaponizedMatter: {
    id: "weaponizedMatter",
    name: "Weaponized Matter",
    zone: null,
    initial: () => 0,
  },
};
