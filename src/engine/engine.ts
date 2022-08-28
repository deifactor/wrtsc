import {
  ClassConstructor,
  Exclude,
  Expose,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
} from "class-transformer";
import { entries, makeValues } from "../records";

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
import { Schedule } from "./schedule";
import { Skill, SkillId, SKILL_IDS } from "./skills";
import { Task } from "./task";
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

function _convertRecord<T>(cls: ClassConstructor<T>) {
  return function (params: { value: any }): Record<string, T> {
    const obj = params.value;
    Object.keys(obj).forEach((key) => {
      obj[key] = plainToInstance(cls, obj[key]);
    });
    return obj as Record<string, T>;
  };
}
const INITIAL_ENERGY = 5000;

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
@Exclude()
export class Engine {
  // Saved player state.
  @Expose()
  @Transform(_convertRecord(Progress), { toClassOnly: true })
  readonly progress: Record<ProgressId, Progress>;
  @Expose()
  @Transform(_convertRecord(Skill), { toClassOnly: true })
  readonly skills: Record<SkillId, Skill>;
  @Expose()
  @Transform((params: { value: MilestoneId[] }) => new Set(params.value), {
    toClassOnly: true,
  })
  private readonly _milestones: Set<MilestoneId> = new Set();
  @Expose()
  timeAcrossAllLoops: number = 0;

  // Unsaved player state that's adjusted as we go through a loop.
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneKind: ZoneKind = RUINS.kind;

  schedule: Schedule = new Schedule([], this);

  /** `undefined` means the task is not finished yet. */
  completions: { amount: number; success: boolean | undefined }[] = [];

  /** Time, in milliseconds, since the start of the loop. */
  private _timeInLoop: number = 0;
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  private _totalEnergy: number = INITIAL_ENERGY;

  constructor() {
    this.progress = makeValues(PROGRESS_IDS, () => new Progress());
    this.skills = makeValues(SKILL_IDS, () => new Skill());
    this.flags = {
      shipHijacked: false,
    };
    this.resources = makeValues(RESOURCE_IDS, (res) =>
      RESOURCES[res].initial(this)
    );
  }

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
  startLoop(queue: TaskQueue) {
    this._timeInLoop = 0;
    this._energy = this._totalEnergy = INITIAL_ENERGY;
    this.schedule = new Schedule(queue, this);
    this.completions = queue.map(() => ({ amount: 0, success: undefined }));
    for (const resource of RESOURCE_IDS) {
      this.resources[resource] = RESOURCES[resource].initial(this);
    }
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
      this.progress[progress].addXp(xp);
    });
    entries(rewards.flags || {}).forEach(([flag, value]) => {
      this.flags[flag] = value;
    });
    entries(task.trainedSkills).forEach(([id, xp]) => {
      this.skills[id].addXp(xp);
      this.skills.metacognition.addXp(xp);
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

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
    entries(this.schedule.task!.trainedSkills).forEach(([id, xp]) => {
      this.skills[id].addXp(xp);
      this.skills.metacognition.addXp(xp / 10);
    });
    this.perform(this.schedule.task!);
    this.schedule.next();
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
    // We basically 'spend' time from the duration until we hit 0;
    duration = Math.floor(duration);
    while (duration > 0) {
      if (!this.schedule.task) {
        return { ok: true };
      }
      if (!this.canPerform(this.schedule.task)) {
        this.markFailure(this.schedule.task.index);
        return { ok: false, reason: "taskFailed" };
      }
      const ticked = this.schedule.tickTime(Math.min(this.energy, duration));
      this.removeEnergy(ticked);
      this._timeInLoop += ticked;
      this.timeAcrossAllLoops += ticked;
      if (this.schedule.taskDone) {
        this.markSuccess(this.schedule.task.index);
        this.nextTask();
      }
      duration = Math.min(this.energy, duration - ticked);
    }
    if (this.energy <= 0 && this.schedule.task) {
      this.markFailure(this.schedule.task.index);
      return { ok: false, reason: "outOfEnergy" };
    }
    return { ok: true };
  }

  markSuccess(batchIndex: number) {
    this.completions[batchIndex].amount++;
    if (
      this.completions[batchIndex].amount ===
      this.schedule.queue[batchIndex].count
    ) {
      this.completions[batchIndex].success = true;
    }
  }

  markFailure(batchIndex: number) {
    this.completions[batchIndex].success = false;
  }

  simulation(tasks: TaskQueue): SimulationResult {
    // Deep-copy the engine into a new state
    const sim = instanceToInstance(this);
    return sim.simulationImpl(tasks);
  }

  /** Simulates the entire task queue. This mutates everything, so clone before running it! */
  private simulationImpl(tasks: TaskQueue): SimulationResult {
    const result: SimulationResult = [];
    this.startLoop(tasks);
    while (this.schedule.task) {
      const task = this.schedule.task;
      const { ok } = this.tickTime(Math.max(this.schedule.task.cost(this), 1));
      result[task.index] = {
        ok: ok,
        energy: this.energy,
      };
      if (!ok) {
        break;
      }
    }
    return result;
  }

  save(): GameSave {
    return instanceToPlain(this);
  }

  saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.save()));
  }

  static hasSave(): boolean {
    return Boolean(localStorage.getItem(STORAGE_KEY));
  }

  static loadFromStorage(): Engine {
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (stringified) {
      return plainToInstance(Engine, JSON.parse(stringified));
    } else {
      return new Engine();
    }
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

type GameSave = Record<string, any>;
