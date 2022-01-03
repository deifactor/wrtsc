import { trace, makeAutoObservable, runInAction, untracked } from "mobx";
import { Player, PlayerJSON } from "./player";
import { Schedule } from "./schedule";
import { Task } from "./task";
import { TaskQueue, TaskQueuePointer } from "./taskQueue";
import { RUINS, Zone } from "./zone";

export const STORAGE_KEY = "save";

export type TaskFailureReason = "outOfEnergy" | "noTask" | "taskFailed";

export type TickResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: TaskFailureReason;
    };

export type SimulationStep = {
  status: "ok" | "error";
  energy: number;
};

export type SimulationResult = SimulationStep[];

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export class Engine {
  readonly player: Player;
  readonly zone: Zone;
  /** The current schedule. Note that its task queue is *not* the same as `taskQueue`. */
  schedule: Schedule;
  taskQueue: TaskQueue;

  constructor(json?: GameSave) {
    this.player = new Player(json?.player);
    this.zone = RUINS;
    this.schedule = new Schedule(new TaskQueue());
    this.taskQueue = new TaskQueue();
    makeAutoObservable(this);
  }

  /** Restart the time loop. */
  startLoop() {
    this.schedule = new Schedule(this.taskQueue.clone());
    this.player.startLoop();
  }

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
    this.schedule.task?.perform(this.player);
    this.schedule.next();
  }

  /**
   * Advance the simulation by this many *seconds*. If the player runs out of
   * energy, this will restart the engine loop.
   */
  tickTime(amount: number): TickResult {
    if (!this.schedule.task) {
      return { ok: false, reason: "noTask" };
    }
    if (!this.schedule.task.canPerform(this.player)) {
      return { ok: false, reason: "taskFailed" };
    }
    if (amount > this.player.energy) {
      return { ok: false, reason: "outOfEnergy" };
    }
    this.schedule.tickTime(amount);
    if (this.schedule.taskDone) {
      this.schedule.task!.perform(this.player);
      this.schedule.next();
      this.player.setResourceLimits();
    }
    return { ok: true };
  }

  get simulation(): SimulationResult {
    // Deep-copy the engine into a new state
    const sim = new Engine(JSON.parse(JSON.stringify(this.save())));
    const queue = this.taskQueue.clone();
    return untracked(() => {
      sim.taskQueue = queue;
      return sim.simulationImpl();
    });
  }

  /** Simulates the entire task queue. This mutates everything, so clone before running it! */
  private simulationImpl(): SimulationResult {
    const result: SimulationResult = [];
    this.startLoop();
    while (this.schedule.task) {
      const task = this.schedule.task;
      if (!task.canPerform(this.player)) {
        result.push({
          status: "error",
          energy: this.player.energy,
        });
        return result;
      }
      // TODO: deduplicate with Engine.tickTime
      this.schedule.task.perform(this.player);
      this.player.removeEnergy(this.schedule.task.baseCost);
      this.player.setResourceLimits();
      if (
        this.schedule.current!.count ==
        this.schedule.current!.iteration + 1
      ) {
        result.push({
          status: "ok",
          energy: this.player.energy,
        });
      }
      this.schedule.next();
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
