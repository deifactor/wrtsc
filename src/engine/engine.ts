import {
  Exclude,
  instanceToInstance,
  instanceToPlain,
  plainToInstance,
  Type,
} from "class-transformer";

import { Player } from "./player";
import { Schedule } from "./schedule";
import { TaskQueue } from "./taskQueue";

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

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export class Engine {
  @Type(() => Player)
  readonly player: Player;
  /** The current schedule. Note that its task queue is *not* the same as `taskQueue`. */
  @Exclude()
  schedule: Schedule;

  constructor() {
    this.player = new Player();
    this.schedule = new Schedule([], this.player);
  }

  /** Restart the time loop. */
  startLoop(queue: TaskQueue) {
    this.schedule = new Schedule(queue, this.player);
    this.player.startLoop();
  }

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
    this.player.perform(this.schedule.task!);
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
      if (!this.player.canPerform(this.schedule.task)) {
        return { ok: false, reason: "taskFailed" };
      }
      const ticked = this.schedule.tickTime(
        Math.min(this.player.energy, duration)
      );

      this.player.removeEnergy(ticked);
      if (this.schedule.taskDone) {
        this.nextTask();
      }
      duration = Math.min(this.player.energy, duration - ticked);
    }
    if (this.player.energy <= 0 && this.schedule.task) {
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
      const { ok } = this.tickTime(
        Math.max(this.player.cost(this.schedule.task), 1)
      );
      result[task.index] = {
        ok: ok,
        energy: this.player.energy,
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
}

type GameSave = Record<string, any>;
