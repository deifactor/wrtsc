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

  constructor() {
    this.player = new Player();
    this.zone = RUINS;
    this.schedule = new Schedule(new TaskQueue());
    this.taskQueue = new TaskQueue();
    makeAutoObservable(this);
  }

  /** Restart the time loop. */
  startLoop() {
    this.schedule = new Schedule(this.taskQueue.clone());
  }

  /** Iterate to the next task. This includes performing the current task. */
  nextTask() {
    this.schedule.task?.perform(this.player);
    this.schedule.next();
  }

  /** Advance the simulation by this many *seconds*. */
  tickTime(amount: number) {
    this.schedule.tickTime(amount);
    if (this.schedule.taskDone) {
      this.schedule.task!.perform(this.player);
      this.schedule.next();
    }
  }

  save(): GameSave {
    return { player: this.player.save() };
  }

  load(save: GameSave) {
    this.player.load(save.player);
  }

  saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.save()));
  }

  static loadFromStorage(): Engine {
    const engine = new Engine();
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (stringified) {
      engine.load(JSON.parse(stringified));
    }
    return engine;
  }
}

type GameSave = {
  player: PlayerJSON;
};
