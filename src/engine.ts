import { makeAutoObservable } from "mobx";
import { Player, PlayerJSON } from "./player";
import { Schedule } from "./schedule";
import { TaskQueue } from "./taskQueue";
import { RUINS, Zone } from "./zone";

export const STORAGE_KEY = "save";

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export class Engine {
  readonly player: Player;
  readonly zone: Zone;
  /** The current schedule. Note that its task queue is *not* the same as `taskQueue`. */
  schedule: Schedule;
  readonly taskQueue: TaskQueue;

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
  tickTime(amount: number) {
    if (!this.schedule.task) {
      return;
    }
    this.schedule.tickTime(amount);
    if (this.schedule.taskDone) {
      this.schedule.task!.perform(this.player);
      this.schedule.next();
      this.player.setResourceLimits();
    }
    this.player.energy -= amount;
    if (this.player.energy <= 0) {
      this.startLoop();
    }
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
