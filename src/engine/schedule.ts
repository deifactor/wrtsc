import { Engine } from "./engine";
import { TaskQueue, TaskQueueIterator, TaskQueuePointer } from "./taskQueue";

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

  private readonly iter: TaskQueueIterator;

  constructor(queue: TaskQueue, engine: Engine) {
    this.queue = queue;
    this.engine = engine;
    this.iter = new TaskQueueIterator(this.queue);
  }

  get task(): TaskQueuePointer | undefined {
    return this.iter.peek;
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(): void {
    this.iter.next();
  }
}
