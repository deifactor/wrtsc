import { Engine } from "./engine";
import { LoopFlagId, ResourceId, ProgressId, RESOURCES } from "./player";
import { SkillId } from "./skills";

export type TaskKind =
  | "exploreRuins"
  | "scavengeBatteries"
  | "dischargeTeracapacitor"
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
  extraPerform: () => {},
  requiredProgress: {},
  requiredLoopFlags: {},
  requiredResources: {},
  trainedSkills: [],
};

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
  rewards: (engine: Engine) => Rewards;
  /** Skills that performing this task trains: map from skill to amount of XP. */
  trainedSkills: Partial<Record<SkillId, number>>;
  /**
   * Number of times this task can be performed in a loop. This is for tasks
   * such as Scavenge Energy and Link Patrol Drones that effectively just spend
   * a resource. If supplied, this must be always right.
   */
  maxIterations?: (engine: Engine) => number;
};

/**
 * Some timescale stuff. for a one-second task:
 *
 * - 10% takes 1 minute, or about 1% of the total.
 * - 20% takes 3.5 minutes, or about 4% of the total.
 * - 50% takes 21 minutes, or about 25% of the total.
 * - 100% takes 84 minutes.
 */

export const EXPLORE_RUINS: Task = {
  ...defaults,
  kind: "exploreRuins",
  name: "Explore Ruins",
  shortName: "XPL_RUIN",
  cost: () => 2000,
  description:
    "Increases amount of weapons and batteries that can be scavenged. 50% more progress with Ship Hijacked.",
  flavor:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  required: {},
  rewards: () => ({ progress: { ruinsExploration: 1024 } }),
  extraPerform: (engine) => {
    engine.progress.ruinsExploration.addXp(
      (exploreMultiplier(engine) - 1) * 1024
    );
  },
  trainedSkills: { ergodicity: 128 },
};

const BATTERY_AMOUNT = 3000;

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  shortName: "SCAV_BAT",
  cost: () => 500,
  description: `Increases energy by ${BATTERY_AMOUNT}.`,
  flavor:
    "Power source: located. Integration of power source will lead to loop extension.",
  extraPerform: (engine) => {
    engine.addEnergy(BATTERY_AMOUNT);
  },
  required: { resources: { ruinsBatteries: 1 } },
  rewards: () => ({}),
  visible: (engine) => engine.progress.ruinsExploration.level > 0,
  maxIterations: (engine) => RESOURCES.ruinsBatteries.initial(engine),
  trainedSkills: { energyTransfer: 16 },
};

export const DRAIN_TERACAPACITOR: Task = {
  ...defaults,
  kind: "dischargeTeracapacitor",
  name: "Discharge Teracapacitor",
  shortName: "DIS_TERA",
  cost: () => 2000,
  description: `Gives 200 * (seconds spent in loop at end of action) energy, capped at 25600 at 128 seconds.`,
  flavor:
    "Teracapacitor integrity critical. Attempting repair; however, discharge is likely to destroy charging circuits. Recommend delaying their use.",
  required: { resources: { teracapacitors: 1 } },
  rewards: () => ({}),
  visible: (engine) => engine.progress.ruinsExploration.level >= 10,
  maxIterations: (engine) => RESOURCES.teracapacitors.initial(engine),
  extraPerform: (engine) => {
    engine.addEnergy(Math.min(25600, engine.timeInLoop / 5));
  },
  trainedSkills: { energyTransfer: 128 },
};

export const LINK_SENSOR_DRONES: Task = {
  ...defaults,
  kind: "linkSensorDrones",
  name: "Link Sensor Drones",
  shortName: "LINK_DRN",
  cost: () => 1500,
  description:
    "Multiplies progress for Explore Ruins and Observe Patrol Routes by sqrt(1 + linked drones). Bonus stacks with Ship Hijacked bonuses.",
  flavor:
    "Long-range sensors are still responding to pings. Superresolution routines loaded. Beginning handshake...",
  required: {
    resources: { unlinkedSensorDrones: 1 },
    progress: { ruinsExploration: 5 },
  },
  rewards: () => ({ resources: { linkedSensorDrones: 1 } }),
  visible: (engine) => engine.progress.ruinsExploration.level >= 1,
  maxIterations: (engine) => RESOURCES.unlinkedSensorDrones.initial(engine),
  trainedSkills: { datalink: 64 },
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
  rewards: () => ({ progress: { patrolRoutesObserved: 1024 } }),
  extraPerform: (engine) => {
    engine.progress.patrolRoutesObserved.addXp(
      (exploreMultiplier(engine) - 1) * 1024
    );
  },
  visible: (engine) => engine.progress.ruinsExploration.level >= 10,
  trainedSkills: { ergodicity: 128 },
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
  required: {
    resources: { scouts: 1 },
    progress: { patrolRoutesObserved: 10 },
  },
  rewards: () => ({
    resources: {
      weaponSalvage: 1,
      unoccupiedShips: 1,
    },
  }),
  visible: (engine) => engine.progress.patrolRoutesObserved.level > 0,
  maxIterations: (engine) => RESOURCES.scouts.initial(engine),
  trainedSkills: { lethality: 256 },
};

const LOCKOUTS_PER_SHIP = 8;

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "hijackShip",
  name: "Hijack Ship",
  shortName: "HJCK_SHP",
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
  required: {
    resources: { unoccupiedShips: 1 },
    progress: { patrolRoutesObserved: 15 },
  },
  rewards: () => ({
    flags: { shipHijacked: true },
    resources: { qhLockoutAttempts: LOCKOUTS_PER_SHIP },
  }),
  visible: (engine) => engine.progress.patrolRoutesObserved.level >= 1,
  extraPerform: (engine) => {
    engine.addMilestone("shipHijacked");
  },
  maxIterations: (engine) => RESOURCES.scouts.initial(engine),
  trainedSkills: { lethality: 512, spatial: 512 },
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  kind: "disableLockouts",
  name: "Override Lockouts",
  shortName: "OVR_LOCK",
  cost: () => 800,
  description:
    "Hack your stolen ship to bring the weapons, thrusters, and jump drive online.",
  flavor:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  visible: (engine) => engine.hasMilestone("shipHijacked"),
  maxIterations: (engine) =>
    LOCKOUTS_PER_SHIP * RESOURCES.scouts.initial(engine),
  required: { resources: { qhLockoutAttempts: 1 } },
  rewards: () => ({ progress: { qhLockout: 1024 } }),
  trainedSkills: { datalink: 64 },
};

export const STRAFING_RUN: Task = {
  ...defaults,
  kind: "strafingRun",
  name: "Strafing Run",
  shortName: "STRAF_RN",
  cost: () => 6000,
  description:
    "Clean up the remaining Preservers. Consumes all Preserver Scouts Located to give an equal amount of Unoccupied Ships.",
  flavor:
    "Surviving Preserver forces may alert superiors. They cannot be allowed to live.",
  visible: (engine) => engine.hasMilestone("shipHijacked"),
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 50 },
  },
  rewards: () => ({}),
  trainedSkills: { spatial: 128 },
};

export const DISMANTLE_SENSOR_DRONES: Task = {
  ...defaults,
  kind: "dismantleSensorDrones",
  name: "Dismantle Sensor Drones",
  shortName: "DSMN_DRN",
  cost: () => 500,
  description:
    "Use your stolen ship to fly to your sensor drone array. Each drone dismantled provides 3000 AEU.",
  flavor:
    "There is nothing left for them to monitor. The Sixteenth Flower is gone.",
  visible: (engine) => engine.hasMilestone("shipHijacked"),
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 25 },
    resources: { linkedSensorDrones: 1 },
  },
  rewards: () => ({}),
  extraPerform: (engine) => engine.addEnergy(3000),
  trainedSkills: { energyTransfer: 16, datalink: 16 },
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
  rewards: () => ({}),
  extraPerform: (engine) => {
    engine.zoneKind = "phobosDeimos";
  },
  visible: (engine) => engine.hasMilestone("shipHijacked"),
  trainedSkills: { spatial: 128 },
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
  rewards: () => ({}),
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
  trainedSkills: {},
};

export const TASKS: Record<TaskKind, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  dischargeTeracapacitor: DRAIN_TERACAPACITOR,
  linkSensorDrones: LINK_SENSOR_DRONES,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
  eradicateScout: KILL_SCOUT,
  hijackShip: HIJACK_SHIP,
  disableLockouts: DISABLE_LOCKOUTS,
  dismantleSensorDrones: DISMANTLE_SENSOR_DRONES,
  strafingRun: STRAFING_RUN,
  leaveRuins: LEAVE_RUINS,
  completeRuins: COMPLETE_RUINS,
};

function exploreMultiplier(engine: Engine): number {
  const droneBonus = Math.sqrt(1 + engine.resources.linkedSensorDrones) - 1;
  const shipBonus = engine.flags.shipHijacked ? 0.5 : 0;
  const datalinkBonus = Math.log2(1 + engine.skills.datalink.level / 32);
  return (1 + droneBonus * (1 + datalinkBonus)) * (1 + shipBonus);
}
