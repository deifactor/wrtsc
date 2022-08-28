import { Engine } from "./engine";
import { Task, TASKS } from "./task";
import { TaskQueue } from "./taskQueue";

export interface Stats {
  completions: number;
}

/**
 * A schedule is a list of task entries, plus a pointer into which task is
 * currently executing and a count of how many times each task has executed so
 * far. (Currently that will be `count` for any task already executed, but
 * eventually we'll have tasks that can fail.)
 */
export class Schedule {
  // Don't mutate this.
  readonly queue: TaskQueue;
  readonly engine: Engine;
  index = 0;
  iteration = 0;

  constructor(queue: TaskQueue, engine: Engine) {
    this.queue = queue;
    this.engine = engine;
  }

  get task(): Task | undefined {
    const id = this.queue[this.index]?.task;
    return id && TASKS[id];
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(): void {
    if (this.task === undefined) {
      return;
    }
    this.iteration += 1;
    if (this.iteration >= this.queue[this.index].count) {
      this.index += 1;
      this.iteration = 0;
    }
  }
}
