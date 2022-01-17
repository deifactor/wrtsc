import { makeAutoObservable, untracked } from "mobx";
import { Player, PlayerJSON } from "./player";
import { Schedule } from "./schedule";
import { TaskQueue } from "./taskQueue";
import { RUINS, Zone } from "./zone";

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
  readonly player: Player;
  readonly zone: Zone;
  /** The current schedule. Note that its task queue is *not* the same as `taskQueue`. */
  schedule: Schedule;
  nextLoopTasks: TaskQueue;

  constructor(json?: GameSave) {
    this.player = new Player(json?.player);
    this.zone = RUINS;
    this.schedule = new Schedule(new TaskQueue(), this.player);
    this.nextLoopTasks = new TaskQueue();
    makeAutoObservable(this);
  }

  /** Restart the time loop. */
  startLoop() {
    this.schedule = new Schedule(this.nextLoopTasks.clone(), this.player);
    this.player.startLoop();
  }

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
    this.schedule.task?.extraPerform(this.player);
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
        this.player.perform(this.schedule.task!);
        this.schedule.next();
      }
      duration = Math.min(this.player.energy, duration - ticked);
    }
    if (this.player.energy <= 0 && this.schedule.task) {
      return { ok: false, reason: "outOfEnergy" };
    }
    return { ok: true };
  }

  get simulation(): SimulationResult {
    // Deep-copy the engine into a new state
    const sim = new Engine(JSON.parse(JSON.stringify(this.save())));
    const queue = this.nextLoopTasks.clone();
    return untracked(() => {
      sim.nextLoopTasks = queue;
      return sim.simulationImpl();
    });
  }

  /** Simulates the entire task queue. This mutates everything, so clone before running it! */
  private simulationImpl(): SimulationResult {
    const result: SimulationResult = [];
    this.startLoop();
    while (this.schedule.task) {
      const task = this.schedule.task;
      const { ok } = this.tickTime(this.player.cost(this.schedule.task));
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
    return { player: this.player.save() };
  }

  saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.save()));
  }

  static loadFromStorage(): Engine {
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (stringified) {
      return new Engine(JSON.parse(stringified));
    } else {
      return new Engine();
    }
  }
}

type GameSave = {
  player: PlayerJSON;
};
