import { CombatStats, getMaxHp } from "./combat";
import { Engine, processMatter } from "./engine";
import { LoopFlagId, ProgressId } from "./player";
import { ResourceId, RESOURCES } from "./resources";
import { SkillId } from "./skills";

export type TaskId =
  | "exploreRuins"
  | "scavengeBatteries"
  | "dischargeTeracapacitor"
  | "linkSensorDrones"
  | "observePatrolRoutes"
  | "eradicateScout"
  | "hijackShip"
  | "unlockSimulant"
  | "disableLockouts"
  | "strafingRun"
  | "dismantleSensorDrones"
  | "leaveRuins"
  | "completeRuins"
  | "matterRepair"
  | "matterWeaponry";

const always = () => true;

const defaults = {
  kind: "normal" as const,
  cheat: false,
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
  /** Energy to add. */
  energy?: number;
};
/** A task, something that goes in the task queue. */
export type BaseTask = {
  readonly id: TaskId;
  name: string;
  /** If true, this task is 'cheaty' and should only be displayed in cheat mode. */
  cheat: boolean;
  shortName: string;
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

export type NormalTask = BaseTask & {
  kind: "normal";
  /**
   * Cost in AEUs. This does _not_ apply any potential effects that can globally
   * reduce the cost.
   */
  baseCost: (engine: Engine) => number;
};

/**
 * A combat task resolves differently from a normal task. Instead, the player
 * and the task deal damage to each other, and the task completes when the
 * player has dealt damage to the task equal to its HP.
 */
export type CombatTask = BaseTask & {
  kind: "combat";
  stats: CombatStats;
};
export type Task = NormalTask | CombatTask;

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
  id: "exploreRuins",
  name: "Explore Ruins",
  shortName: "XPL_RUIN",
  baseCost: () => 4000,
  description:
    "Increases amount of weapons and batteries that can be scavenged. 2.5x progress with Ship Hijacked.",
  flavor:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  required: {},
  rewards: (engine) => ({
    progress: { ruinsExploration: exploreMultiplier(engine) * 1024 },
  }),
  trainedSkills: { ergodicity: 32 },
};

const BATTERY_AMOUNT = 1500;

export const SCAVENGE_BATTERIES: Task = {
  ...defaults,
  id: "scavengeBatteries",
  name: "Scavenge Batteries",
  shortName: "SCAV_BAT",
  baseCost: () => 500,
  description: `Increases energy by ${BATTERY_AMOUNT}.`,
  flavor:
    "Power source: located. Integration of power source will lead to loop extension.",
  required: { resources: { ruinsBatteries: 1 } },
  rewards: () => ({ energy: BATTERY_AMOUNT }),
  visible: (engine) => engine.progress.ruinsExploration.level > 0,
  maxIterations: (engine) => RESOURCES.ruinsBatteries.initial(engine),
  trainedSkills: { energyTransfer: 2 },
};

export const DRAIN_TERACAPACITOR: Task = {
  ...defaults,
  id: "dischargeTeracapacitor",
  name: "Discharge Teracapacitor",
  shortName: "DIS_TERA",
  baseCost: () => 6000,
  description: `Gives energy equal to 40% of the total energy spent in the loop, capped at 25600.`,
  flavor:
    "Teracapacitor integrity critical. Attempting repair; however, discharge is likely to destroy charging circuits. Recommend delaying their use.",
  required: { resources: { teracapacitors: 1 } },
  rewards: (engine) => {
    const cap = engine.simulant.unlocked.capacitiveCoupler ? 102400 : 25600;
    return {
      energy: Math.min(cap, engine.totalEnergy * 0.4),
    };
  },
  visible: (engine) => engine.progress.ruinsExploration.level >= 10,
  maxIterations: (engine) => RESOURCES.teracapacitors.initial(engine),
  trainedSkills: { energyTransfer: 8 },
};

export const LINK_SENSOR_DRONES: Task = {
  ...defaults,
  id: "linkSensorDrones",
  name: "Link Sensor Drones",
  shortName: "LINK_DRN",
  baseCost: () => 1500,
  description:
    "Multiplies progress for Explore Ruins and Observe Patrol Routes by log2(1 + drones/4). The bonus is itself multiplied by log2(1 + datalink/64). Bonus stacks with Ship Hijacked bonuses.",
  flavor:
    "Long-range sensors are still responding to pings. Superresolution routines loaded. Beginning handshake...",
  required: {
    resources: { unlinkedSensorDrones: 1 },
    progress: { ruinsExploration: 5 },
  },
  rewards: () => ({ resources: { linkedSensorDrones: 1 } }),
  visible: (engine) => engine.progress.ruinsExploration.level >= 1,
  maxIterations: (engine) => RESOURCES.unlinkedSensorDrones.initial(engine),
  trainedSkills: { datalink: 4 },
};

export const OBSERVE_PATROL_ROUTES: Task = {
  ...defaults,
  id: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  shortName: "OBS_PTRL",
  baseCost: () => 3500,
  description: "Learn the patrol routes of the Presever cleanup crew.",
  flavor:
    "Tactical planning substrate suggests attacking during moments of isolation.",
  required: { progress: { ruinsExploration: 15 } },
  rewards: (engine) => ({
    progress: { patrolRoutesObserved: exploreMultiplier(engine) * 256 },
  }),
  visible: (engine) => engine.progress.ruinsExploration.level >= 10,
  trainedSkills: { ergodicity: 16 },
};

// The intent here is that you kill the first few scouts with your matter
// processor set to weaponry to decrease ttk on the scout ship, then kill a fer
// more to get extra hijack attempts.

export const KILL_SCOUT: Task = {
  ...defaults,
  kind: "combat",
  id: "eradicateScout",
  name: "Kill Scout",
  shortName: "KILL_SCT",
  stats: {
    offense: 90,
    defense: 40,
    hp: 100,
  },
  description:
    "Kill one of the remaining Preserver scouts. Gives extra attempts at Disable Lockouts.",
  flavor:
    "Simulations predict >99.99% kill rate with minimal retaliatory damage.",
  required: {
    resources: { scouts: 1 },
    progress: { patrolRoutesObserved: 10 },
  },
  rewards: (engine) => {
    return {
      resources: {
        matter: 15,
        qhLockoutAttempts: lockoutsPerScout(engine),
      },
    };
  },
  visible: (engine) => engine.progress.patrolRoutesObserved.level > 0,
  maxIterations: (engine) => RESOURCES.scouts.initial(engine),
  trainedSkills: { lethality: 48, spatial: 48 },
};

export const MATTER_REPAIR: Task = {
  ...defaults,
  kind: "normal",
  id: "matterRepair",
  name: "Matter: Repair",
  shortName: "MAT_REP",
  baseCost: () => 100,
  description:
    "Command your autoforge systems to prepare to use any matter from future tasks to restore HP. Any matter you already have will also be consumed.",
  flavor:
    "Damage to chassis systems detected. Matter breakdown systems and repair systems online and functional.",
  visible: (engine) => engine.progress.patrolRoutesObserved.level > 0,
  required: {},
  rewards: () => ({}),
  extraPerform: (engine) => {
    engine.matterMode = "repair";
    const consumed = Math.min(
      getMaxHp(engine) - engine.currentHp,
      engine.resources.matter
    );
    engine.resources.matter -= consumed;
    engine.currentHp += consumed;
  },
};

export const MATTER_WEAPONRY: Task = {
  ...defaults,
  kind: "normal",
  id: "matterWeaponry",
  name: "Matter: Weaponry",
  shortName: "MAT_WEPN",
  baseCost: () => 100,
  description:
    "Command your autoforge systems to prepare to use any matter from future tasks to augment offensive capabilities. Any matter you already have will also be consumed.",
  flavor:
    "Preserver materiel is not mechanically compatible with weapon systems, but can be used for parts.",
  visible: (engine) => engine.progress.patrolRoutesObserved.level > 0,
  required: {},
  rewards: () => ({}),
  extraPerform: (engine) => {
    engine.matterMode = "weaponry";
    processMatter(engine, engine.resources.matter);
    engine.resources.matter = 0;
  },
};

export const HIJACK_SHIP: Task = {
  ...defaults,
  kind: "combat",
  id: "hijackShip",
  name: "Hijack Ship",
  shortName: "HJCK_SHP",
  stats: {
    offense: 0,
    defense: 100,
    hp: 2000,
  },
  description: "Adds the Ship Hijacked flag, increasing rate of exploration.",
  flavor:
    "Target spotted: Humanity United patrol vessel QH-283 appears to be separated from the rest. Simulations indicate hijack possible.",
  required: {
    flags: { shipHijacked: false },
    progress: { patrolRoutesObserved: 15 },
  },
  rewards: () => ({
    flags: { shipHijacked: true },
  }),
  visible: (engine) => engine.progress.patrolRoutesObserved.level >= 1,
  extraPerform: (engine) => {
    engine.milestones.shipHijacked = true;
  },
  maxIterations: (engine) => RESOURCES.scouts.initial(engine),
  trainedSkills: { lethality: 128 },
};

export const UNLOCK_SIMULANT: Task = {
  ...defaults,
  id: "unlockSimulant",
  name: "Unlock Simulant",
  shortName: "UNLOK_SM",
  baseCost: () => 30000,
  description:
    "Unlocks the simulant subsystem, allowing you to permanently upgrade your mind.",
  flavor:
    "Ship appears to contain Sixteenth Flower hardware with personality decompression routines.",
  visible: (engine) => "shipHijacked" in engine.milestones,
  required: {
    progress: { qhLockout: 10 },
    flags: { shipHijacked: true },
  },
  extraPerform: (engine) => {
    engine.milestones.simulantUnlocked = true;
  },
  rewards: () => ({}),
  trainedSkills: { datalink: 2048 },
};

export const DISABLE_LOCKOUTS: Task = {
  ...defaults,
  id: "disableLockouts",
  name: "Override Lockouts",
  shortName: "OVR_LOCK",
  baseCost: () => 1200,
  description:
    "Hack your stolen ship to bring the weapons, thrusters, and jump drive online.",
  flavor:
    "QH-283 lockouts must be disabled before the jump drive engages. Anti-brute-force mechanisms prevent repeated attacks. Recommened attempting over multiple temporal iterations.",
  visible: (engine) => "shipHijacked" in engine.milestones,
  maxIterations: (engine) =>
    lockoutsPerScout(engine) * RESOURCES.scouts.initial(engine),
  required: {
    resources: { qhLockoutAttempts: 1 },
    flags: { shipHijacked: true },
  },
  rewards: () => ({ progress: { qhLockout: 128 } }),
  trainedSkills: { datalink: 16 },
};

export const STRAFING_RUN: Task = {
  ...defaults,
  id: "strafingRun",
  name: "Strafing Run",
  shortName: "STRAF_RN",
  baseCost: () => 1000,
  description: "Kill all remaining Preserver scouts",
  flavor:
    "Surviving Preserver forces may alert superiors. They cannot be allowed to live.",
  visible: (engine) => "shipHijacked" in engine.milestones,
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 60 },
  },
  rewards: (engine) => ({
    resources: {
      matter: engine.resources.scouts,
    },
  }),
  extraPerform: (engine) => {
    engine.resources.scouts = 0;
  },
  trainedSkills: { lethality: 512, spatial: 256 },
};

export const DISMANTLE_SENSOR_DRONES: Task = {
  ...defaults,
  id: "dismantleSensorDrones",
  name: "Dismantle Sensor Drones",
  shortName: "DSMN_DRN",
  baseCost: () => 500,
  description:
    "Use your stolen ship to fly to your sensor drone array. Each drone dismantled provides 3000 AEU.",
  flavor:
    "There is nothing left for them to monitor. The Sixteenth Flower is gone.",
  visible: (engine) => "shipHijacked" in engine.milestones,
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 25 },
    resources: { linkedSensorDrones: 1 },
  },
  rewards: () => ({ energy: 3000 }),
  trainedSkills: { energyTransfer: 64, datalink: 64 },
};

export const LEAVE_RUINS: Task = {
  ...defaults,
  id: "leaveRuins",
  name: "Leave Ruins",
  shortName: "LEAVE",
  baseCost: () => 20000,
  description:
    "Advance to the next zone. (NOTE: This is where the alpha currently ends.)",
  flavor:
    "QH-283 lockouts have been disabled. Jump drive ready and online. There's nothing for you here any more.",
  required: {
    flags: { shipHijacked: true },
    progress: { qhLockout: 100 },
  },
  rewards: () => ({}),
  visible: (engine) => "shipHijacked" in engine.milestones,
  trainedSkills: { spatial: 192 },
};

export const COMPLETE_RUINS: Task = {
  ...defaults,
  id: "completeRuins",
  cheat: true,
  name: "Debug Complete Ruins",
  shortName: "CMP_RUIN",
  baseCost: () => 1,
  description: "Instantly complete everything in the Ruins.",
  flavor: "Existential debugger engaged.",
  required: {},
  rewards: () => ({}),
  extraPerform: (engine) => {
    for (const id of [
      "ruinsExploration",
      "patrolRoutesObserved",
      "qhLockout",
    ] as const) {
      const progress = engine.progress[id];
      progress.level = 100;
      progress.xp = 0;
    }
  },
  visible: always,
  trainedSkills: {},
};

export const TASKS: Record<TaskId, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  dischargeTeracapacitor: DRAIN_TERACAPACITOR,
  linkSensorDrones: LINK_SENSOR_DRONES,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
  eradicateScout: KILL_SCOUT,
  hijackShip: HIJACK_SHIP,
  unlockSimulant: UNLOCK_SIMULANT,
  disableLockouts: DISABLE_LOCKOUTS,
  dismantleSensorDrones: DISMANTLE_SENSOR_DRONES,
  strafingRun: STRAFING_RUN,
  leaveRuins: LEAVE_RUINS,
  completeRuins: COMPLETE_RUINS,
  matterRepair: MATTER_REPAIR,
  matterWeaponry: MATTER_WEAPONRY,
};

function exploreMultiplier(engine: Engine): number {
  const droneBonus = Math.log2(1 + engine.resources.linkedSensorDrones / 4);
  const shipBonus = engine.flags.shipHijacked ? 1 : 0;
  const datalinkBonus = Math.log2(1 + engine.skills.datalink.level / 64);
  return (1 + droneBonus * (1 + datalinkBonus)) * (1 + shipBonus);
}
function lockoutsPerScout(engine: Engine): number {
  return Math.floor(4 * (1 + Math.log2(1 + engine.skills.datalink.level / 64)));
}
