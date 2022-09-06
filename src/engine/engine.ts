import { entries, makeValues, mapValues } from "../records";

import {
  Progress,
  LoopFlagId,
  ResourceId,
  ProgressId,
  RESOURCES,
  RESOURCE_IDS,
  MilestoneId,
  PROGRESS_IDS,
} from "./player";
import { Simulant, SimulantSave } from "./simulant";
import { Skill, SkillId, SKILL_IDS } from "./skills";
import { Task, TASKS } from "./task";
import { TaskQueue } from "./taskQueue";
import { RUINS, ZoneKind } from "./zone";

export const STORAGE_KEY = "save";

export type TaskFailureReason = "outOfEnergy" | "taskFailed";

export type TickResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: TaskFailureReason;
    };

export type SimulationStep = {
  ok: boolean;
  energy: number;
};

export type SimulationResult = SimulationStep[];

const INITIAL_ENERGY = 5000;

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export abstract class Engine<ScheduleT = unknown> {
  // Saved player state.
  readonly progress: Record<ProgressId, Progress>;
  readonly skills: Record<SkillId, Skill>;
  protected readonly _milestones: Set<MilestoneId>;
  timeAcrossAllLoops: number;
  simulant: Simulant;

  // Unsaved player state that's adjusted as we go through a loop.
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneKind: ZoneKind = RUINS.kind;

  timeLeftOnTask: number | undefined = undefined;

  /** Time, in milliseconds, since the start of the loop. */
  private _timeInLoop: number = 0;
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  private _totalEnergy: number = INITIAL_ENERGY;

  constructor(save?: EngineSave) {
    this.progress = makeValues(PROGRESS_IDS, () => new Progress());
    this.skills = makeValues(SKILL_IDS, () => new Skill());
    this._milestones = new Set();
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
      this._milestones = new Set(save.milestones);
      this.timeAcrossAllLoops = save.timeAcrossAllLoops;
    }
    this.flags = {
      shipHijacked: false,
    };
    this.resources = makeValues(RESOURCE_IDS, (res) =>
      RESOURCES[res].initial(this)
    );
  }

  /** Stores the current task. */
  abstract get task(): Task | undefined;
  /**
   * Called to advance to the next task. The argument indicates whether the task
   * succeeded or not.
   */
  abstract next(success: boolean): void;

  /** Sets the schedule from the given object. Implicitly called via startLoop. */
  protected abstract setSchedule(schedule: ScheduleT): void;

  get energy(): number {
    return this._energy;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  get timeInLoop(): number {
    return this._timeInLoop;
  }

  /** Restart the time loop. */
  startLoop(schedule: ScheduleT) {
    this._timeInLoop = 0;
    this._energy = this._totalEnergy = INITIAL_ENERGY;
    for (const resource of RESOURCE_IDS) {
      this.resources[resource] = RESOURCES[resource].initial(this);
    }
    this.flags = {
      shipHijacked: false,
    };
    this.setSchedule(schedule);
    this.timeLeftOnTask = this.task?.cost(this);
  }

  perform(task: Task) {
    const rewards = task.rewards(this);
    entries(task.required.resources || {}).forEach(([res, value]) => {
      this.resources[res] -= value;
    });
    entries(rewards.resources || {}).forEach(([res, value]) => {
      this.resources[res] += value;
    });
    entries(rewards.progress || {}).forEach(([progress, xp]) => {
      this.progress[progress].addXp(
        xp * (1 + Math.log2(1 + this.skills.ergodicity.level / 128))
      );
    });
    entries(rewards.flags || {}).forEach(([flag, value]) => {
      this.flags[flag] = value;
    });
    entries(task.trainedSkills).forEach(([id, xp]) => {
      const metaMult = 1 + Math.log2(1 + this.skills.metacognition.level / 256);
      this.skills[id].addXp(xp * metaMult);
      this.skills.metacognition.addXp((xp * metaMult) / 4);
    });
    rewards.energy && this.addEnergy(rewards.energy);
    task.extraPerform(this);
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

  hasMilestone(milestone: MilestoneId) {
    return this._milestones.has(milestone);
  }

  addMilestone(milestone: MilestoneId) {
    this._milestones.add(milestone);
  }

  get combat(): number {
    return (
      (1 + this.skills.lethality.level / 10) *
        (1 + this.resources.weaponSalvage) -
      1
    );
  }

  /**
   * Advance the simulation by this many milliseconds. Returns an indication of
   * whether there was an error in the simulation.
   *
   * - `taskFailed` indicates that the task failed to be performed.
   * - `outOfEnergy` indicates that the player ran out in the middle of a task.
   *
   * Note that this will automatically 'slice' the tick into smaller ticks if it
   * would cross a boundary. E.g., if there are 50 ms left on a task and you
   * give it a 100ms tick then it'll do a 50ms and then another 50ms.
   */
  tickTime(duration: number): TickResult {
    // We basically 'spend' time from the duration until we hit 0. The
    // multiplier here is a multiplier on how much energy we're spending per
    // second.
    const mult = this.simulant.unlocked.has("burstClock")
      ? Math.max(1, 2 - this.timeInLoop / 16384)
      : 1;
    duration *= mult;
    duration = Math.floor(duration);
    while (duration > 0) {
      if (!this.task) {
        return { ok: true };
      }
      if (!this.canPerform(this.task)) {
        this.next(false);
        return { ok: false, reason: "taskFailed" };
      }
      if (!this.timeLeftOnTask) {
        throw new Error("timeLeftOnTask unset despite task being set");
      }
      const ticked = Math.min(this.timeLeftOnTask!, this.energy, duration);
      this.removeEnergy(ticked);
      this._timeInLoop += ticked / mult;
      this.timeAcrossAllLoops += ticked / mult;
      this.timeLeftOnTask! -= ticked;
      if (this.timeLeftOnTask === 0) {
        this.perform(this.task);
        this.next(true);
        this.timeLeftOnTask = this.task?.cost(this);
      }
      duration = Math.min(this.energy, duration - ticked);
    }
    if (this.energy <= 0 && this.task) {
      this.next(false);
      return { ok: false, reason: "outOfEnergy" };
    }
    return { ok: true };
  }

  addEnergy(amount: number) {
    amount *=
      1 + Math.log(1 + this.skills.energyTransfer.level / 128) / Math.log(2);
    amount = Math.floor(amount);
    this._energy += amount;
    this._totalEnergy += amount;
  }

  removeEnergy(amount: number) {
    this._energy -= amount;
  }
}

export class QueueEngine extends Engine<TaskQueue> {
  queue: TaskQueue = [];
  /** The index of the task batch we're in. */
  index = 0;
  /**
   * Which iteration within the batch. Zero-indexed, so 0 means we're working on
   * the first iteration.
   */
  iteration = 0;
  completions: { total: number; success: number; failure: number }[] = [];

  constructor(save?: EngineSave) {
    super(save);
    this.queue = [];
  }

  get task(): Task | undefined {
    const id = this.queue[this.index]?.task;
    return id && TASKS[id];
  }

  next(success: boolean): void {
    if (this.task === undefined) {
      return;
    }
    const completions = this.completions[this.index];
    if (success) {
      completions.success++;
    } else {
      completions.failure++;
    }
    this.iteration += 1;
    if (this.iteration >= this.queue[this.index].count) {
      this.index += 1;
      this.iteration = 0;
    }
  }

  setSchedule(queue: TaskQueue) {
    this.queue = queue;
    this.index = 0;
    this.iteration = 0;
    this.completions = queue.map((entry) => ({
      total: entry.count,
      success: 0,
      failure: 0,
    }));
  }

  simulation(tasks: TaskQueue): SimulationResult {
    // Deep-copy the engine into a new state
    const sim = new QueueEngine(this.toSave());
    return sim.simulationImpl(tasks);
  }

  /** Simulates the entire task queue. This mutates everything, so clone before running it! */
  private simulationImpl(tasks: TaskQueue): SimulationResult {
    const result: SimulationResult = [];
    this.startLoop(tasks);
    while (this.task) {
      // need to get the index *before* we tick, since that can advance the index.
      const index = this.index;
      const { ok } = this.tickTime(Math.max(this.task.cost(this), 1));
      result[index] = {
        ok: ok,
        energy: this.energy,
      };
      if (!ok) {
        break;
      }
    }
    return result;
  }

  toSave(): EngineSave {
    return {
      progress: mapValues(this.progress, (progress) => ({
        xp: progress.xp,
        level: progress.level,
      })),
      skills: mapValues(this.skills, (skill) => ({
        xp: skill.xp,
        level: skill.level,
      })),
      milestones: Array.from(this._milestones),
      timeAcrossAllLoops: this.timeAcrossAllLoops,
      simulant: this.simulant.toSave(),
    };
  }
}

export type EngineSave = {
  progress: Record<ProgressId, { xp: number; level: number }>;
  skills: Record<SkillId, { xp: number; level: number }>;
  milestones: MilestoneId[];
  simulant: SimulantSave;
  timeAcrossAllLoops: number;
};
