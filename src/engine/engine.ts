import {
  ClassConstructor,
  Exclude,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Transform,
} from "class-transformer";

import { Level, LoopFlagId, ResourceId, StatId } from "./player";
import { Schedule } from "./schedule";
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
export class Engine {
  /** The current schedule. Note that its task queue is *not* the same as `taskQueue`. */
  @Transform(_convertRecord(Level), { toClassOnly: true })
  readonly stats: Record<StatId, Level> = {
    ruinsExploration: new Level(),
    patrolRoutesObserved: new Level(),
    qhLockout: new Level(),
  };

  resources: Record<ResourceId, number> = {
    ruinsBatteries: 0,
    ruinsWeapons: 0,
    qhLockoutAttempts: 0,
  };

  flags: Record<LoopFlagId, boolean> = {
    shipHijacked: false,
  };

  zoneKind: ZoneKind = RUINS.kind;

  @Exclude()
  schedule: Schedule = new Schedule([], this);

  @Exclude()
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  @Exclude()
  private _totalEnergy: number = INITIAL_ENERGY;

  get energy(): number {
    return this._energy;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  /** Restart the time loop. */
  startLoop(queue: TaskQueue) {
    this.schedule = new Schedule(queue, this);
  }

  perform(task: Task) {
    task.extraPerform(this);
    Object.entries(task.requiredResources).forEach(([res, value]) => {
      this.resources[res as ResourceId] -= value;
    });
  }

  canPerform(task: Task): boolean {
    return (
      Object.entries(task.requiredStats).every(
        ([id, min]) => this.stats[id as StatId].level >= min
      ) &&
      Object.entries(task.requiredResources).every(
        ([id, min]) => this.resources[id as ResourceId] >= min
      ) &&
      Object.entries(task.requiredLoopFlags).every(
        ([id, value]) => this.flags[id as LoopFlagId] === value
      ) &&
      task.extraCheck(this)
    );
  }

  /**
   * Whether the task can be added to the queue. This is true if there's *some*
   * conceivable world where the player can perform this task. So it skips over
   * flag checks and only checks against *max* resources.
   */
  canAddToQueue(task: Task): boolean {
    return (
      Object.entries(task.requiredStats).every(
        ([id, min]) => this.stats[id as StatId].level >= min
      ) &&
      Object.entries(task.requiredResources).every(
        ([id, min]) => this.maxResource(id as ResourceId) >= min
      )
    );
  }

  maxResource(resource: ResourceId): number {
    switch (resource) {
      case "ruinsBatteries":
        return Math.floor(this.stats.ruinsExploration.level / 4);
      case "ruinsWeapons":
        return Math.floor(this.stats.ruinsExploration.level / 8);
      case "qhLockoutAttempts":
        return 12;
    }
  }

  get combat(): number {
    return this.maxResource("ruinsWeapons") - this.resources.ruinsWeapons;
  }

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
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
        return { ok: false, reason: "taskFailed" };
      }
      const ticked = this.schedule.tickTime(Math.min(this.energy, duration));

      this.removeEnergy(ticked);
      if (this.schedule.taskDone) {
        this.nextTask();
      }
      duration = Math.min(this.energy, duration - ticked);
    }
    if (this.energy <= 0 && this.schedule.task) {
      return { ok: false, reason: "outOfEnergy" };
    }
    return { ok: true };
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
    this._energy += amount;
    this._totalEnergy += amount;
  }

  removeEnergy(amount: number) {
    this._energy -= amount;
  }
}

type GameSave = Record<string, any>;
