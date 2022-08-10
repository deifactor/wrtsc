import { Engine } from "./engine";
import { LoopFlagId, ResourceId, SkillId, StatId } from "./player";

export type TaskKind =
  | "exploreRuins"
  | "scavengeBatteries"
  | "linkSensorDrones"
  | "observePatrolRoutes"
  | "eradicateScout"
  | "hijackShip"
  | "disableLockouts"
  | "strafingRun"
  | "dismantleSensorDrones"
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
  cost: (engine: Engine) => number;
  /** The description of the task itself, as read by the player. */
  description: string;
  /** Flavor text. Not game-relevant. Generally written in a `robotic` tone. */
  flavor: string;
  /** Any actions to take that aren't described by the other fields. */
  extraPerform: (engine: Engine) => void;
  /**
   * Predicate that determines whether the action should be shown to the player.
   * Note that this doesn't mean the player can take it; see `enabled`.
   */
  visible: (engine: Engine) => boolean;
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
  extraCheck: (engine: Engine) => boolean;
}>;

export const EXPLORE_RUINS: Task = {
  ...defaults,
  kind: "exploreRuins",
  name: "Explore Ruins",
  shortName: "XPL_RUIN",
  cost: () => 2500,
  description:
    "Increases amount of weapons and batteries that can be scavenged. 8x progress with Ship Hijacked.",
  flavor:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  extraPerform: (engine) => {
    const mult = engine.flags.shipHijacked ? 8 : 2;
    engine.stats.ruinsExploration.addXp(mult * 1024);
  },
  trainedSkills: ["ergodicity"],
};

const BATTERY_AMOUNT = 3500;

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  shortName: "SCAV_BAT",
  cost: () => 1000,
  description: `Increases energy by ${BATTERY_AMOUNT}.`,
  flavor:
    "Power source: located. Integration of power source will lead to loop extension.",
  extraPerform: (engine) => {
    engine.addEnergy(BATTERY_AMOUNT);
  },
  requiredResources: { ruinsBatteries: 1 },
  visible: (engine) => engine.stats.ruinsExploration.level > 0,
};

export const LINK_SENSOR_DRONES: Task = {
  ...defaults,
  kind: "linkSensorDrones",
  name: "Link Sensor Drones",
  shortName: "LINK_DRN",
  cost: () => 1500,
  description: `Increases progress for ${EXPLORE_RUINS.name}.`,
  flavor:
    "Long-range sensors are still responding to pings. Superresolution routines loaded.",
};

export const OBSERVE_PATROL_ROUTES: Task = {
  ...defaults,
  kind: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  shortName: "OBS_PTRL",
  cost: () => 3000,
  description: "Learn the patrol routes of the Presever cleanup crew.",
  flavor:
    "Tactical planning substrate suggests attacking during moments of isolation.",
  extraPerform: (engine) => {
    engine.stats.patrolRoutesObserved.addXp(1024 * 6);
  },
};

export const KILL_SCOUT: Task = {
  ...defaults,
  kind: "eradicateScout",
  name: "Kill Scout",
  shortName: "KILL_SCT",
  cost: () => 3000,
  description:
    "Kill one of the remaining Preserver scouts and take their ship. Gives extra attempts at Disable Lockouts.",
  flavor:
    "Simulations predict >99.99% kill rate with minimal retaliatory damage.",
};

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "hijackShip",
  name: "Hijack Ship",
  shortName: "HIJACK",
  cost: (engine) =>
    Math.max(
      24000 -
        engine.combat * 1500 -
        engine.stats.patrolRoutesObserved.level * 100,
      6000
    ),
  description:
    "Adds the Ship Hijacked flag. Cost decreases with Combat and Patrol Routes Observed.",
  flavor:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  extraPerform: (engine) => {
    engine.flags.shipHijacked = true;
  },
  requiredStats: { patrolRoutesObserved: 30 },
  visible: (engine) => engine.stats.patrolRoutesObserved.level >= 1,
  trainedSkills: ["lethality"],
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  kind: "disableLockouts",
  name: "Override Lockouts",
  shortName: "OVR_LOCK",
  cost: () => 3000,
  description:
    "Can only be performed 12 times in a loop. Requires Ship Hijacked.",
  flavor:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  extraPerform: (engine) => {
    engine.stats.qhLockout.addXp(1024 * 10);
  },
  requiredStats: { patrolRoutesObserved: 10 },
  requiredResources: { qhLockoutAttempts: 1 },
  requiredLoopFlags: { shipHijacked: true },
  visible: (engine) => engine.stats.patrolRoutesObserved.level >= 20,
};

export const STRAFING_RUN: Task = {
  ...defaults,
  kind: "strafingRun",
  name: "Strafing Run",
  shortName: "STRAFE",
  cost: () => 3000,
  description: "Clean up the remaining Preservers.",
  flavor:
    "Surviving Preserver forces may alert superiors. They cannot be allowed to live.",
};

export const DISMANTLE_SENSOR_DRONES: Task = {
  ...defaults,
  kind: "dismantleSensorDrones",
  name: "Dismantle Sensor Drones",
  shortName: "DSMNTL",
  cost: () => 3000,
  description: "Extract remaining energy from sensor drones.",
  flavor: "There is nothing left for them to monitor.",
};

export const LEAVE_RUINS: Task = {
  ...defaults,
  kind: "leaveRuins",
  name: "Leave Ruins",
  shortName: "LEAVE",
  cost: () => 20000,
  description: "Advance to the next zone.",
  flavor:
    "QH-283 lockouts have been disabled. Jump drive ready and online. There's nothing for you here any more.",
  requiredStats: { qhLockout: 100 },
  extraPerform: (engine) => {
    engine.zoneKind = "phobosDeimos";
  },
  visible: (engine) => engine.stats.patrolRoutesObserved.level >= 30,
};

export const COMPLETE_RUINS: Task = {
  ...defaults,
  kind: "completeRuins",
  name: "Debug Complete Ruins",
  shortName: "CMP_RUIN",
  cost: () => 1,
  description: "Instantly complete everything in the Ruins.",
  flavor: "Existential debugger engaged.",
  extraPerform: (engine) => {
    for (const kind of [
      "ruinsExploration",
      "patrolRoutesObserved",
      "qhLockout",
    ] as const) {
      const stat = engine.stats[kind];
      stat.level = 100;
      stat.xp = 0;
    }
  },
  visible: always,
};

export const TASKS: Record<TaskKind, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  linkSensorDrones: LINK_SENSOR_DRONES,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
  eradicateScout: KILL_SCOUT,
  hijackShip: HIJACK_SHIP,
  disableLockouts: DISABLE_LOCKOUTS,
  strafingRun: STRAFING_RUN,
  dismantleSensorDrones: DISMANTLE_SENSOR_DRONES,
  leaveRuins: LEAVE_RUINS,
  completeRuins: COMPLETE_RUINS,
};
