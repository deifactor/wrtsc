import { Engine } from "./engine";
import { LoopFlagId, ResourceId, SkillId, ProgressId } from "./player";

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
  requiredProgress: {},
  requiredLoopFlags: {},
  requiredResources: {},
  trainedSkills: [],
};

// Some notes: at 1-1-1-1 2-2-2-2 etc task progression, it takes about 1300
// repetitions to finish a task.

export type Requirements = {
  /** These progress values must be at least this large. */
  progress?: Partial<Record<ProgressId, number>>;
  /** These resources will be subtracted in the given amounts. */
  resources?: Partial<Record<ResourceId, number>>;
  /** These flags must be present with the specified values. */
  flags?: Partial<Record<LoopFlagId, boolean>>;
};
export type Rewards = {
  /** Rewards this much xp to the given progress. */
  progress?: Partial<Record<ProgressId, number>>;
  /** Adjusts the resource count by this much. */
  resources?: Partial<Record<ResourceId, number>>;
  /** Sets the flags to the given values. */
  flags?: Partial<Record<LoopFlagId, boolean>>;
};
/** A task, something that goes in the task queue. */
export type Task = {
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
  required: Requirements;
  rewards: Rewards;
  /**
   * Skills that performing this task trains. This is an array and not a set,
   * even though it's unique, because the type inference works better this way.
   */
  trainedSkills: SkillId[];
  /**
   * An extra predicate indicating whether the action can be taken. This is on
   * top of any requirements.
   */
  extraCheck: (engine: Engine) => boolean;
};

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
  required: {},
  rewards: { progress: { ruinsExploration: 1024 } },
  extraPerform: (engine) => {
    if (engine.flags.shipHijacked) {
      engine.progress.ruinsExploration.addXp(7 * 1024);
    }
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
  required: { resources: { ruinsBatteries: 1 } },
  rewards: {},
  visible: (engine) => engine.progress.ruinsExploration.level > 0,
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
  extraPerform: (engine) => engine.resources.linkedSensorDrones++,
  required: {
    resources: { unlinkedSensorDrones: 1 },
    progress: { ruinsExploration: 10 },
  },
  rewards: { resources: { linkedSensorDrones: 1 } },
  visible: (engine) => engine.progress.ruinsExploration.level > 5,
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
  required: { progress: { ruinsExploration: 15 } },
  rewards: { progress: { patrolRoutesObserved: 1024 * 6 } },
  visible: (engine) => engine.progress.ruinsExploration.level > 10,
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
  required: { resources: { scouts: 1 } },
  rewards: {
    resources: {
      weaponSalvage: 1,
      unoccupiedShips: 1,
    },
  },
  visible: (engine) => engine.progress.patrolRoutesObserved.level > 0,
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
        engine.progress.patrolRoutesObserved.level * 100,
      6000
    ),
  description:
    "Adds the Ship Hijacked flag. Cost decreases with Combat and Patrol Routes Observed.",
  flavor:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  required: { resources: { unoccupiedShips: 1 } },
  rewards: {
    flags: { shipHijacked: true },
    resources: { qhLockoutAttempts: 12 },
  },
  visible: (engine) => engine.progress.patrolRoutesObserved.level >= 1,
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
  visible: (engine) => engine.progress.patrolRoutesObserved.level >= 1,
  required: { resources: { qhLockoutAttempts: 1 } },
  rewards: { progress: { qhLockout: 1024 * 10 } },
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
  visible: (engine) => engine.progress.qhLockout.level >= 25,
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 50 },
  },
  rewards: {},
};

export const DISMANTLE_SENSOR_DRONES: Task = {
  ...defaults,
  kind: "dismantleSensorDrones",
  name: "Dismantle Sensor Drones",
  shortName: "DSMNTL",
  cost: () => 3000,
  description: "Extract remaining energy from sensor drones.",
  flavor: "There is nothing left for them to monitor.",
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 25 },
  },
  rewards: {},
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
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 100 },
  },
  rewards: {},
  extraPerform: (engine) => {
    engine.zoneKind = "phobosDeimos";
  },
  visible: (engine) => engine.progress.qhLockout.level >= 50,
};

export const COMPLETE_RUINS: Task = {
  ...defaults,
  kind: "completeRuins",
  name: "Debug Complete Ruins",
  shortName: "CMP_RUIN",
  cost: () => 1,
  description: "Instantly complete everything in the Ruins.",
  flavor: "Existential debugger engaged.",
  required: {},
  rewards: {},
  extraPerform: (engine) => {
    for (const kind of [
      "ruinsExploration",
      "patrolRoutesObserved",
      "qhLockout",
    ] as const) {
      const progress = engine.progress[kind];
      progress.level = 100;
      progress.xp = 0;
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
