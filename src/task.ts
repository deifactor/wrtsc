import { LoopFlagId, Player, ResourceId, SkillId, StatId } from "./player";

export type TaskKind =
  | "exploreRuins"
  | "scavengeBatteries"
  | "scavengeWeapons"
  | "observePatrolRoutes"
  | "hijackShip"
  | "disableLockouts"
  | "leaveRuins"
  | "completeRuins";

const always = () => true;

const defaults = {
  visible: always,
  extraCheck: always,
  extraPerform: () => {},
  requiredStats: {},
  requiredLoopFlags: {},
  requiredResources: {},
  trainedSkills: [],
};

// Some notes: at 1-1-1-1 2-2-2-2 etc task progression, it takes about 1300
// repetitions to finish a task.

/** A task, something that goes in the task queue. */
export type Task = Readonly<{
  readonly kind: TaskKind;
  name: string;
  shortName: string;
  /** Cost in AEUs. */
  cost: number | ((player: Player) => number);
  /** The description of the task itself, as read by the player. */
  description: string;
  /** Flavor text. Not game-relevant. Generally written in a `robotic` tone. */
  flavor: string;
  /** Any actions to take that aren't described by the other fields. */
  extraPerform: (player: Player) => void;
  /**
   * Predicate that determines whether the action should be shown to the player.
   * Note that this doesn't mean the player can take it; see `enabled`.
   */
  visible: (player: Player) => boolean;
  /** Minimum stats for the action to be performable. */
  requiredStats: Partial<Record<StatId, number>>;
  /**
   * Skills that performing this task trains. This is an array and not a set,
   * even though it's unique, because the type inference works better this way.
   */
  trainedSkills: SkillId[];
  /**
   * Skills that tsh skills: SkillId[]; /** Minimum resources for the action to
   * be performable. This will also result in the player consuming the resources
   * on perform.
   */
  requiredResources: Partial<Record<ResourceId, number>>;
  /** These flags must be present with the given values. */
  requiredLoopFlags: Partial<Record<LoopFlagId, boolean>>;
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
  shortName: "XPL_RUIN",
  cost: 2500,
  description:
    "Increases amount of weapons and batteries that can be scavenged. 8x progress with Ship Hijacked.",
  flavor:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  extraPerform: (player: Player) => {
    const mult = player.flags.shipHijacked ? 8 : 2;
    player.stats.ruinsExploration.addXp(mult * 1024);
  },
  trainedSkills: ["ergodicity"],
};

const BATTERY_AMOUNT = 3500;

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  shortName: "SCAV_BAT",
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
  shortName: "SCAV_WPN",
  cost: 800,
  description:
    "Increases your Combat stat by 1. Does not persist across resets.",
  flavor:
    "Onboard weaponry has suffered critical damage and requires repair from locally-available components.",
  requiredResources: { ruinsWeapons: 1 },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
  trainedSkills: ["lethality"],
};

export const OBSERVE_PATROL_ROUTES: Task = {
  ...defaults,
  kind: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  shortName: "OBS_PTRL",
  cost: 3000,
  description: "Search for vessels to hijack. Decreases cost of Hijack Ship.",
  flavor:
    "Transit will require a ship. Humanity United patrol vessels appear to be searching for survivors. Recommend route observation to determine optimal hijack strategy.",
  extraPerform: (player: Player) => {
    player.stats.patrolRoutesObserved.addXp(1024 * 6);
  },
  requiredStats: { ruinsExploration: 10 },
  visible: (player) => player.stats.ruinsExploration.level >= 5,
  trainedSkills: ["ergodicity"],
};

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "hijackShip",
  name: "Hijack Ship",
  shortName: "HIJACK",
  cost: (player: Player) =>
    Math.max(
      24000 -
        player.combat * 1500 -
        player.stats.patrolRoutesObserved.level * 100,
      6000
    ),
  description:
    "Adds the Ship Hijacked flag. Cost decreases with Combat and Patrol Routes Observed.",
  flavor:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  extraPerform: (player: Player) => {
    player.flags.shipHijacked = true;
  },
  requiredStats: { patrolRoutesObserved: 30 },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 1,
  trainedSkills: ["lethality"],
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  kind: "disableLockouts",
  name: "Override Lockouts",
  shortName: "OVR_LOCK",
  cost: 3000,
  description:
    "Can only be performed 12 times in a loop. Requires Ship Hijacked.",
  flavor:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  extraPerform: (player: Player) => {
    player.stats.qhLockout.addXp(1024 * 10);
  },
  requiredStats: { patrolRoutesObserved: 10 },
  requiredResources: { qhLockoutAttempts: 1 },
  requiredLoopFlags: { shipHijacked: true },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 20,
};

export const LEAVE_RUINS: Task = {
  ...defaults,
  kind: "leaveRuins",
  name: "Leave Ruins",
  shortName: "LEAVE",
  cost: 20000,
  description: "Advance to the next zone.",
  flavor:
    "QH-283 lockouts have been disabled. Jump drive ready and online. There's nothing for you here any more.",
  requiredStats: { qhLockout: 100 },
  extraPerform: (player) => {
    player.zoneKind = "phobosDeimos";
  },
  visible: (player) => player.stats.patrolRoutesObserved.level >= 30,
};

export const COMPLETE_RUINS: Task = {
  ...defaults,
  kind: "completeRuins",
  name: "Debug Complete Ruins",
  shortName: "CMP_RUIN",
  cost: 1,
  description: "Instantly complete everything in the Ruins.",
  flavor: "Existential debugger engaged.",
  extraPerform: (player) => {
    for (const kind of [
      "ruinsExploration",
      "patrolRoutesObserved",
      "qhLockout",
    ] as const) {
      const stat = player.stats[kind];
      stat.level = 100;
      stat.xp = 0;
    }
  },
  visible: always,
};

export const TASKS: Record<TaskKind, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  scavengeWeapons: SCAVENGE_WEAPONS,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
  hijackShip: HIJACK_SHIP,
  disableLockouts: DISABLE_LOCKOUTS,
  leaveRuins: LEAVE_RUINS,
  completeRuins: COMPLETE_RUINS,
};
