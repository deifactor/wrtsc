import { Player, ResourceName, StatName } from "./player";

export type TaskKind =
  | "exploreRuins"
  | "scavengeBatteries"
  | "scavengeWeapons"
  | "observePatrolRoutes"
  | "hijackShip"
  | "disableLockouts"
  | "leaveRuins";

const always = () => true;

const defaults = {
  visible: always,
  extraCheck: always,
  requiredStats: {},
  requiredResources: {},
};

/** A task, something that goes in the task queue. */
export type Task = Readonly<{
  readonly kind: TaskKind;
  name: string;
  // Cost in AEUs.
  baseCost: number;
  description: string;
  extraPerform: (player: Player) => void;
  /**
   * Predicate that determines whether the action should be shown to the player.
   * Note that this doesn't mean the player can take it; see `enabled`.
   */
  visible: (player: Player) => boolean;
  /** Minimum stats for the action to be performable. */
  requiredStats: Partial<Record<StatName, number>>;
  /**
   * Minimum resources for the action to be performable. This will also result
   * in the player consuming the resources on perform.
   */
  requiredResources: Partial<Record<ResourceName, number>>;
  /**
   * An extra predicate indicating whether the action can be taken. This is on
   * top of any requirements.
   */
  extraCheck: (player: Player) => boolean;
}>;

export const EXPLORE_RUINS: Task = {
  ...defaults,
  kind: "exploreRuins",
  name: "Explore Ruins",
  baseCost: 2500,
  description:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  extraPerform: ({ stats }: Player) => {
    stats.ruinsExploration.addXp(1024);
  },
};

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  baseCost: 1000,
  description:
    "Power source: located. Integration of power source will lead to loop extension.",
  extraPerform: (player: Player) => {
    player.addEnergy(3500);
  },
  requiredStats: { ruinsExploration: 1 },
  requiredResources: { ruinsBatteries: 1 },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const SCAVENGE_WEAPONS: Task = {
  ...defaults,
  kind: "scavengeWeapons",
  name: "Scavenge Weapons",
  baseCost: 1000,
  description:
    "Onboard weaponry has suffered critical damage and requires repair from locally-available components.",
  extraPerform: (player: Player) => {
    player.stats.combat.addXp(1024);
  },
  requiredStats: { ruinsExploration: 1 },
  requiredResources: { ruinsWeapons: 1 },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const OBSERVE_PATROL_ROUTES: Task = {
  ...defaults,
  kind: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  baseCost: 4000,
  description:
    "Transit will require a ship. Humanity United patrol vessels appear to be searching for survivors. Recommend route observation to determine optimal hijack strategy.",
  extraPerform: (player: Player) => {
    player.stats.patrolRoutesObserved.addXp(1024);
  },
  requiredStats: { ruinsExploration: 10 },
  visible: (player) => player.stats.ruinsExploration.level >= 5,
};

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "hijackShip",
  name: "Hijack Ship",
  baseCost: 20000,
  description:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  extraPerform: () => {},
  requiredStats: { patrolRoutesObserved: 10 },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 1,
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  kind: "disableLockouts",
  name: "Disable Lockouts",
  baseCost: 2000,
  description:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  extraPerform: () => {},
  requiredStats: { patrolRoutesObserved: 10 },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 1,
};

export const LEAVE_RUINS: Task = {
  ...defaults,
  kind: "leaveRuins",
  name: "Leave Ruins",
  baseCost: 20000,
  description:
    "QH-283 lockouts have been disabled. Jump drive ready and online. There's nothing for you here any more.",
  extraPerform: () => {},
};

export const TASKS: Record<TaskKind, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  scavengeWeapons: SCAVENGE_WEAPONS,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
  hijackShip: HIJACK_SHIP,
  disableLockouts: DISABLE_LOCKOUTS,
  leaveRuins: LEAVE_RUINS,
};
