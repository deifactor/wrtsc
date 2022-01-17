import { makeAutoObservable, trace } from "mobx";
import { FlagId, Player, ResourceId, StatId } from "./player";

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
  extraPerform: () => {},
  requiredStats: {},
  requiredFlags: {},
  requiredResources: {},
};

// Some notes: at 1-1-1-1 2-2-2-2 etc task progression, it takes about 1300
// repetitions to finish a task.

/** A task, something that goes in the task queue. */
export type Task = Readonly<{
  readonly kind: TaskKind;
  name: string;
  /** Cost in AEUs. */
  cost: number | ((player: Player) => number);
  /** The description of the task itself, as read by the player. */
  description: string;
  /** Flavor text. Not game-relevant. Generally written in a `robotic` tone. */
  flavor: string;
  extraPerform: (player: Player) => void;
  /**
   * Predicate that determines whether the action should be shown to the player.
   * Note that this doesn't mean the player can take it; see `enabled`.
   */
  visible: (player: Player) => boolean;
  /** Minimum stats for the action to be performable. */
  requiredStats: Partial<Record<StatId, number>>;
  /**
   * Minimum resources for the action to be performable. This will also result
   * in the player consuming the resources on perform.
   */
  requiredResources: Partial<Record<ResourceId, number>>;
  /** These flags must be present with the given values. */
  requiredFlags: Partial<Record<FlagId, boolean>>;
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
  cost: 2500,
  description:
    "Increases amount of weapons and batteries that can be scavenged. 8x progress with Ship Hijacked.",
  flavor:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  extraPerform: (player: Player) => {
    const mult = player.flags.shipHijacked ? 8 : 1;
    player.stats.ruinsExploration.addXp(mult * 1024);
  },
};

const BATTERY_AMOUNT = 3500;

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  cost: 1000,
  description: `Increases energy by ${BATTERY_AMOUNT}.`,
  flavor:
    "Power source: located. Integration of power source will lead to loop extension.",
  extraPerform: (player: Player) => {
    player.addEnergy(BATTERY_AMOUNT);
  },
  requiredResources: { ruinsBatteries: 1 },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const SCAVENGE_WEAPONS: Task = {
  ...defaults,
  kind: "scavengeWeapons",
  name: "Scavenge Weapons",
  cost: 800,
  description:
    "Increases your Combat stat by 1. Does not persist across resets.",
  flavor:
    "Onboard weaponry has suffered critical damage and requires repair from locally-available components.",
  requiredResources: { ruinsWeapons: 1 },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const OBSERVE_PATROL_ROUTES: Task = {
  ...defaults,
  kind: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  cost: 3000,
  description: "Search for vessels to hijack. Decreases cost of Hijack Ship.",
  flavor:
    "Transit will require a ship. Humanity United patrol vessels appear to be searching for survivors. Recommend route observation to determine optimal hijack strategy.",
  extraPerform: (player: Player) => {
    player.stats.patrolRoutesObserved.addXp(1024 * 16);
  },
  requiredStats: { ruinsExploration: 10 },
  visible: (player) => player.stats.ruinsExploration.level >= 5,
};

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "hijackShip",
  name: "Hijack Ship",
  cost: (player: Player) =>
    Math.max(
      20000 -
        player.combat * 1500 -
        player.stats.patrolRoutesObserved.level * 100,
      8000
    ),
  description:
    "Adds the Ship Hijacked flag. Cost decreases with Combat and Patrol Routes Observed.",
  flavor:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  extraPerform: (player: Player) => {
    player.flags.shipHijacked = true;
  },
  requiredStats: { patrolRoutesObserved: 10 },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 1,
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  kind: "disableLockouts",
  name: "Disable Lockouts",
  cost: 3000,
  description:
    "Can only be performed 8 times in a loop. Requires Ship Hijacked.",
  flavor:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  extraPerform: (player: Player) => {
    player.stats.qhLockout.addXp(1024 * 10);
  },
  requiredStats: { patrolRoutesObserved: 10 },
  requiredFlags: { shipHijacked: true },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 1,
};

export const LEAVE_RUINS: Task = {
  ...defaults,
  kind: "leaveRuins",
  name: "Leave Ruins",
  cost: 20000,
  description: "Advance to the next zone.",
  flavor:
    "QH-283 lockouts have been disabled. Jump drive ready and online. There's nothing for you here any more.",
  requiredStats: { qhLockout: 100 },
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
