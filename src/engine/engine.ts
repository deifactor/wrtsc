import { entries, keys, makeValues, mapValues } from "../records";
import { damagePerEnergy, getMaxHp } from "./combat";

import {
  Progress,
  LoopFlagId,
  ResourceId,
  ProgressId,
  RESOURCES,
  RESOURCE_IDS,
  MilestoneId,
  PROGRESS_IDS,
  addProgressXp,
} from "./player";
import { QueueSchedule, Schedule } from "./schedule";
import { Simulant, SimulantSave } from "./simulant";
import { Skill, SkillId, SKILL_IDS } from "./skills";
import { CombatTask, NormalTask, Task, TASKS } from "./task";
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
      task: NormalTask;
    }
  | {
      kind: "combat";
      hpTotal: number;
      hpLeft: number;
      task: CombatTask;
    };

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export class Engine<ScheduleT extends Schedule = Schedule> {
  // Saved player state.
  readonly progress: Record<ProgressId, Progress>;
  readonly skills: Record<SkillId, Skill>;
  // We use a Record<T, true> here instead of a Set because Sets aren't serializable.
  milestones: Partial<Record<MilestoneId, true>>;
  timeAcrossAllLoops: number;
  simulant: Simulant;

  schedule: ScheduleT;
  taskState: TaskState | undefined = undefined;

  // Unsaved player state that's adjusted as we go through a loop.
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneId: ZoneId = RUINS.id;

  /** Time, in milliseconds, since the start of the loop. */
  timeInLoop: number = 0;

  /**
   * Current amount of energy the player has. If adding energy, make sure to use
   * addEnergy instead.
   */
  energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  totalEnergy: number = INITIAL_ENERGY;

  currentHp!: number;

  constructor(schedule: ScheduleT, save?: EngineSave) {
    this.progress = makeValues(PROGRESS_IDS, () => ({ level: 0, xp: 0 }));
    this.skills = makeValues(SKILL_IDS, () => ({ level: 0, xp: 0 }));
    this.milestones = {};
    this.simulant = new Simulant(save?.simulant);
    this.timeAcrossAllLoops = 0;
    if (save) {
      entries(save.progress).forEach(([id, { xp, level }]) => {
        this.progress[id].xp = xp;
        this.progress[id].level = level;
      });
      entries(save.skills).forEach(([id, { xp, level }]) => {
        this.skills[id].xp = xp;
        this.skills[id].level = level;
      });
      for (const milestone of save.milestones) {
        this.milestones[milestone] = true;
      }
      this.timeAcrossAllLoops = save.timeAcrossAllLoops;
    }
    this.flags = {
      shipHijacked: false,
    };
    this.resources = makeValues(RESOURCE_IDS, (res) =>
      RESOURCES[res].initial(this)
    );
    this.schedule = schedule;
    this.startLoop(schedule);
  }

  get task(): Task | undefined {
    return this.taskState?.task;
  }

  /** Restart the time loop. */
  startLoop(schedule?: ScheduleT) {
    this.timeInLoop = 0;
    this.energy = this.totalEnergy = INITIAL_ENERGY;
    for (const resource of RESOURCE_IDS) {
      this.resources[resource] = RESOURCES[resource].initial(this);
    }
    this.flags = {
      shipHijacked: false,
    };
    if (schedule) {
      this.schedule = schedule;
    }
    this.currentHp = getMaxHp(this);
    advanceTask(this, undefined);
  }

  canPerform(task: Task): boolean {
    return (
      entries(task.required.progress || {}).every(
        ([id, min]) => this.progress[id].level >= min
      ) &&
      entries(task.required.resources || {}).every(
        ([id, min]) => this.resources[id] >= min
      ) &&
      entries(task.required.flags || {}).every(
        ([id, value]) => this.flags[id] === value
      )
    );
  }

  /**
   * 1 millisecond will spend this many AEUs. This is effectively an increase in
   * tickspeed; you can't do more things, but you can do them faster.
   */
  energyPerMs(): number {
    return this.simulant.unlocked.has("burstClock")
      ? Math.max(1, 2 - this.timeInLoop / 16384)
      : 1;
  }

  /**
   * Amount of energy that's necessary to spend until something interesting
   * happens that changes the simulation: we run out of energy or the current
   * task finishes.
   */
  energyToNextEvent(): number {
    const taskState = this.taskState!;
    let toTaskCompletion;
    switch (taskState.kind) {
      case "normal":
        toTaskCompletion = taskState.energyLeft;
        break;
      case "combat":
        toTaskCompletion =
          taskState.hpLeft / damagePerEnergy(this, taskState.task.stats).dealt;
        break;
    }
    return Math.min(this.energy, toTaskCompletion);
  }
}

export type QueueEngine = Engine<QueueSchedule>;

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
    simulant: engine.simulant.toSave(),
  };
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
export function tickTime(engine: Engine, duration: number): TickResult {
  // Amount of energy we're allowed to spend in this tick.
  const energyPerMs = engine.energyPerMs();
  let unspentEnergy = Math.floor(duration * energyPerMs);
  while (unspentEnergy > 0 && engine.energy > 0) {
    if (!engine.task) {
      return { ok: true };
    }
    if (!engine.canPerform(engine.task)) {
      advanceTask(engine, false);
      return { ok: false, reason: "taskFailed" };
    }
    if (!engine.taskState) {
      throw new Error("timeLeftOnTask unset despite task being set");
    }
    // Spend energy until we run out or something happens.
    const spent = Math.min(engine.energyToNextEvent(), unspentEnergy);
    spendEnergy(engine, spent);

    if (engine.currentHp <= 0) {
      engine.schedule.recordResult(false);
      return { ok: false, reason: "outOfHp" };
    }

    if (isTaskFinished(engine)) {
      perform(engine, engine.task);
      advanceTask(engine, true);
    }
    unspentEnergy -= spent;
  }

  if (engine.energy <= 0 && engine.task) {
    engine.schedule.recordResult(false);
    return { ok: false, reason: "outOfEnergy" };
  }
  return { ok: true };
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
    engine.resources[res] += value;
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
  rewards.simulant && engine.simulant.unlockedSimulants.add(rewards.simulant);
  task.extraPerform(engine);
}

/** Advances the schedule and records the success of the most recent task. */
function advanceTask(engine: Engine, success: boolean | undefined) {
  if (success !== undefined) {
    engine.schedule.recordResult(success);
  }
  const next = engine.schedule.next(engine);
  if (!next) {
    engine.taskState = undefined;
    return;
  }
  const task = TASKS[next];
  switch (task.kind) {
    case "normal":
      engine.taskState = {
        kind: "normal",
        task,
        energyLeft: getCost(engine, task),
        energyTotal: getCost(engine, task),
      };
      return;
    case "combat":
      engine.taskState = {
        kind: "combat",
        task,
        hpLeft: task.stats.hp,
        hpTotal: task.stats.hp,
      };
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
  const energyPerMs = engine.energyPerMs();
  const time = amount / energyPerMs;
  engine.energy -= amount;
  engine.timeInLoop += amount / energyPerMs;
  engine.timeAcrossAllLoops += amount / energyPerMs;
  // Only add simulant XP if there's actually an unlocked simulant.
  if (engine.simulant.unlockedSimulants.size !== 0) {
    engine.simulant.addXp(amount / 1000);
  }
  const taskState = engine.taskState!;
  switch (taskState.kind) {
    case "normal":
      taskState.energyLeft -= amount;
      break;
    case "combat":
      const { dealt, received } = damagePerEnergy(engine, taskState.task.stats);
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
