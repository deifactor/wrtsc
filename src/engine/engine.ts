import { entries, keys, makeValues, mapValues } from "../records";
import { damagePerEnergy, getMaxHp } from "./combat";

import {
  Progress,
  LoopFlagId,
  ProgressId,
  MilestoneId,
  PROGRESS_IDS,
  addProgressXp,
} from "./player";
import { ResourceId, RESOURCES, RESOURCE_IDS } from "./resources";
import { Schedule } from "./schedule";
import {
  makeSimulantState,
  SimulantSave,
  SimulantState,
  toSimulantSave,
} from "./simulant";
import { Skill, SkillId, SKILL_IDS } from "./skills";
import { CombatTask, Task, TaskId, TASKS } from "./task";
import { RUINS, ZoneId } from "./zone";

export const STORAGE_KEY = "save";

export type TaskFailureReason = "outOfEnergy" | "taskFailed" | "outOfHp";

const INITIAL_ENERGY = 5000;

/** The current task and how far in it we are. */
export type TaskState =
  | {
      kind: "normal";
      energyTotal: number;
      energyLeft: number;
      task: TaskId;
    }
  | {
      kind: "combat";
      hpTotal: number;
      hpLeft: number;
      task: TaskId;
    };

/** What to do with matter from defeated enemies? */
export type MatterMode = "save" | "repair" | "weaponry";

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export interface Engine {
  // Saved player state.
  progress: Record<ProgressId, Progress>;
  skills: Record<SkillId, Skill>;
  // We use a Record<T, true> here instead of a Set because Sets aren't serializable.
  milestones: Partial<Record<MilestoneId, true>>;
  timeAcrossAllLoops: number;
  simulant: SimulantState;
  matterMode: MatterMode;

  taskState: TaskState | undefined;

  // Unsaved player state that's adjusted as we go through a loop.
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneId: ZoneId;

  /** Time, in milliseconds, since the start of the loop. */
  timeInLoop: number;

  /**
   * Current amount of energy the player has. If adding energy, make sure to use
   * addEnergy instead.
   */
  energy: number;
  /** The total amount of energy acquired in this loop. */
  totalEnergy: number;

  currentHp: number;
}

export function makeEngine(schedule: Schedule, save?: EngineSave): Engine {
  const engine: Engine = {
    progress: makeValues(PROGRESS_IDS, () => ({ level: 0, xp: 0 })),
    skills: makeValues(SKILL_IDS, () => ({ level: 0, xp: 0 })),
    milestones: {},
    simulant: makeSimulantState(save?.simulant),
    timeAcrossAllLoops: 0,
    flags: {
      shipHijacked: false,
    },
    matterMode: "repair",
    energy: INITIAL_ENERGY,
    totalEnergy: INITIAL_ENERGY,
    timeInLoop: 0,
    zoneId: RUINS.id,
    taskState: undefined,
    // we'll set these two later in this function
    resources: makeValues(RESOURCE_IDS, () => 0),
    currentHp: 0,
  };
  if (save) {
    entries(save.progress).forEach(([id, { xp, level }]) => {
      engine.progress[id].xp = xp;
      engine.progress[id].level = level;
    });
    entries(save.skills).forEach(([id, { xp, level }]) => {
      engine.skills[id].xp = xp;
      engine.skills[id].level = level;
    });
    for (const milestone of save.milestones) {
      engine.milestones[milestone] = true;
    }
    engine.timeAcrossAllLoops = save.timeAcrossAllLoops;
  }
  engine.resources = makeValues(RESOURCE_IDS, (res) =>
    RESOURCES[res].initial(engine)
  );
  startLoop(engine, schedule);
  return engine;
}

export type EngineSave = {
  progress: Record<ProgressId, { xp: number; level: number }>;
  skills: Record<SkillId, { xp: number; level: number }>;
  milestones: MilestoneId[];
  simulant: SimulantSave;
  timeAcrossAllLoops: number;
};

export function toEngineSave(engine: Engine): EngineSave {
  return {
    progress: mapValues(engine.progress, (progress) => ({
      xp: progress.xp,
      level: progress.level,
    })),
    skills: mapValues(engine.skills, (skill) => ({
      xp: skill.xp,
      level: skill.level,
    })),
    milestones: Array.from(keys(engine.milestones)),
    timeAcrossAllLoops: engine.timeAcrossAllLoops,
    simulant: toSimulantSave(engine.simulant),
  };
}

/**
 * True if the engine meets the requiriments for the task. Does *not* check
 * energy or HP. XXX: rename this or something.
 */
export function canPerform(engine: Engine, task: Task): boolean {
  return (
    entries(task.required.progress || {}).every(
      ([id, min]) => engine.progress[id].level >= min
    ) &&
    entries(task.required.resources || {}).every(
      ([id, min]) => engine.resources[id] >= min
    ) &&
    entries(task.required.flags || {}).every(
      ([id, value]) => engine.flags[id] === value
    )
  );
}

/**
 * Energy cost of the task after applying any global cost modifiers. For normal
 * tasks, this is just the cost; for combat tasks, it's the amount of energy
 * necessary to do damage equal to the task's HP.
 */
export function getCost(engine: Engine, task: Task) {
  switch (task.kind) {
    case "normal":
      return task.baseCost(engine);
    case "combat":
      return task.stats.hp / damagePerEnergy(engine, task.stats).dealt;
  }
}

export type TickResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: TaskFailureReason;
    };

/**
 * Advance the simulation by this many milliseconds. Returns an indication of
 * whether there was an error in the simulation.
 *
 * - `taskFailed` indicates that the task failed to be performed.
 * - `outOfEnergy` indicates that the player ran out in the middle of a task.
 *
 * Note that this will automatically 'slice' the tick into smaller ticks if it
 * would cross a boundary. E.g., if there are 50 ms left on a task and you give
 * it a 100ms tick then it'll do a 50ms and then another 50ms.
 */
export function tickTime(
  engine: Engine,
  schedule: Schedule,
  duration: number
): TickResult {
  // Amount of energy we're allowed to spend in this tick.
  const energyPerMs = getEnergyPerMs(engine);
  let unspentEnergy = Math.floor(duration * energyPerMs);
  while (unspentEnergy > 0 && engine.energy > 0) {
    const task = getCurrentTask(engine);
    if (!task) {
      return { ok: true };
    }
    if (!canPerform(engine, task)) {
      schedule.recordResult(false);
      advanceTask(engine, schedule);
      return { ok: false, reason: "taskFailed" };
    }
    if (!engine.taskState) {
      throw new Error("timeLeftOnTask unset despite task being set");
    }
    // Spend energy until we run out or something happens.
    const spent = Math.min(getEnergyToNextEvent(engine), unspentEnergy);
    spendEnergy(engine, spent);

    if (engine.currentHp <= 0) {
      schedule.recordResult(false);
      return { ok: false, reason: "outOfHp" };
    }

    if (isTaskFinished(engine)) {
      perform(engine, task);
      schedule.recordResult(true);
      advanceTask(engine, schedule);
    }
    unspentEnergy -= spent;
  }

  if (engine.energy <= 0 && engine.taskState?.task) {
    schedule.recordResult(false);
    return { ok: false, reason: "outOfEnergy" };
  }
  return { ok: true };
}

/**
 * 1 millisecond will spend this many AEUs. This is effectively an increase in
 * tickspeed; you can't do more things, but you can do them faster.
 */
export function getEnergyPerMs(engine: Engine): number {
  return "burstClock" in engine.simulant.unlocked
    ? Math.max(1, 2 - engine.timeInLoop / 16384)
    : 1;
}

/**
 * Amount of energy that's necessary to spend until something interesting
 * happens that changes the simulation: we run out of energy or the current task
 * finishes.
 */
export function getEnergyToNextEvent(engine: Engine): number {
  const taskState = engine.taskState!;
  let toTaskCompletion;
  switch (taskState.kind) {
    case "normal":
      toTaskCompletion = taskState.energyLeft;
      break;
    case "combat":
      const task = TASKS[taskState.task] as CombatTask;
      toTaskCompletion =
        taskState.hpLeft / damagePerEnergy(engine, task.stats).dealt;
      break;
  }
  return Math.min(engine.energy, toTaskCompletion);
}

export function getCurrentTask(engine: Engine): Task | undefined {
  const id = engine.taskState?.task;
  return id && TASKS[id];
}

// Private utility functions used for implementing the public API.

/**
 * Actually execute the given task.
 *
 * This subtracts requirements and adds rewards and XP. This does not advance
 * the engine's schedule or anything like that.
 */
function perform(engine: Engine, task: Task) {
  const rewards = task.rewards(engine);
  entries(task.required.resources || {}).forEach(([res, value]) => {
    engine.resources[res] -= value;
  });
  entries(rewards.resources || {}).forEach(([res, value]) => {
    if (res !== "matter") {
      engine.resources[res] += value;
      return;
    }
    processMatter(engine, value);
  });
  entries(rewards.progress || {}).forEach(([progress, xp]) => {
    addProgressXp(
      engine.progress[progress],
      xp * (1 + Math.log2(1 + engine.skills.ergodicity.level / 128))
    );
  });
  entries(rewards.flags || {}).forEach(([flag, value]) => {
    engine.flags[flag] = value;
  });
  entries(task.trainedSkills).forEach(([id, xp]) => {
    const metaMult = 1 + Math.log2(1 + engine.skills.metacognition.level / 256);
    addProgressXp(engine.skills[id], xp * metaMult);
    addProgressXp(engine.skills.metacognition, (xp * metaMult) / 4);
  });
  rewards.energy && addEnergy(engine, rewards.energy);
  if (rewards.simulant) {
    engine.simulant.unlockedSimulants[rewards.simulant] = true;
  }
  task.extraPerform(engine);
}

/** Restart the time loop. */
export function startLoop(engine: Engine, schedule: Schedule) {
  engine.timeInLoop = 0;
  engine.energy = engine.totalEnergy = INITIAL_ENERGY;
  for (const resource of RESOURCE_IDS) {
    engine.resources[resource] = RESOURCES[resource].initial(engine);
  }
  engine.flags = {
    shipHijacked: false,
  };
  engine.currentHp = getMaxHp(engine);
  engine.matterMode = "save";
  advanceTask(engine, schedule);
}

/** Sets the engine's task to the next task from the given schedule. */
function advanceTask(engine: Engine, schedule: Schedule) {
  const next = schedule.next(engine);
  if (!next) {
    engine.taskState = undefined;
    return;
  }
  const task = TASKS[next];
  switch (task.kind) {
    case "normal":
      engine.taskState = {
        kind: "normal",
        task: task.id,
        energyLeft: getCost(engine, task),
        energyTotal: getCost(engine, task),
      };
      return;
    case "combat":
      engine.taskState = {
        kind: "combat",
        task: task.id,
        hpLeft: task.stats.hp,
        hpTotal: task.stats.hp,
      };
      return;
  }
}

/** Whether or not the engine's current task is finished. */
function isTaskFinished(engine: Engine): boolean {
  if (!engine.taskState) {
    throw new Error(
      "Tried to figure out if the task is finished, but there was no task!"
    );
  }
  const state = engine.taskState!;
  switch (state.kind) {
    case "normal":
      return state.energyLeft <= 0;
    case "combat":
      return state.hpLeft <= 0;
  }
}

function addEnergy(engine: Engine, amount: number) {
  amount *=
    1 + Math.log(1 + engine.skills.energyTransfer.level / 128) / Math.log(2);
  amount = Math.floor(amount);
  engine.energy += amount;
  engine.totalEnergy += amount;
}

/**
 * Does everything associated with spending energy: increases the time counters
 * and simulant XP.
 */
function spendEnergy(engine: Engine, amount: number) {
  const energyPerMs = getEnergyPerMs(engine);
  const time = amount / energyPerMs;
  engine.energy -= amount;
  engine.timeInLoop += amount / energyPerMs;
  engine.timeAcrossAllLoops += amount / energyPerMs;
  // Only add simulant XP if there's actually an unlocked simulant.
  if (keys(engine.simulant.unlockedSimulants).length !== 0) {
    engine.simulant.freeXp += amount / 1000;
  }
  const taskState = engine.taskState!;
  switch (taskState.kind) {
    case "normal":
      taskState.energyLeft -= amount;
      break;
    case "combat":
      const task = getCurrentTask(engine)! as CombatTask;
      const { dealt, received } = damagePerEnergy(engine, task.stats);
      taskState.hpLeft -= time * dealt;
      engine.currentHp -= time * received;
      // floating-point math strikes again; engine prevents the player from
      // surviving something that should have reduced them to exactly 0 HP.
      if (Math.abs(engine.currentHp) < 0.001) {
        engine.currentHp = 0;
      }
      break;
  }
}

/* Invoked whenever the player receives matter. Does something different based on the player's matter mode. */
export function processMatter(engine: Engine, value: number) {
  switch (engine.matterMode) {
    case "save":
      engine.resources.matter += value;
      return;
    case "weaponry":
      engine.resources.weaponizedMatter += value;
      return;
    case "repair":
      const consumed = Math.min(getMaxHp(engine) - engine.currentHp, value);
      engine.currentHp += consumed;
      value -= consumed;
      if (value > 0) {
        engine.resources.matter += value;
      }
  }
}
