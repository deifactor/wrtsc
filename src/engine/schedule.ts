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
export class QueueSchedule {
  // Don't mutate this.
  readonly queue: TaskQueue;
  index = 0;
  iteration = 0;
  /** `undefined` means the task is not finished yet. */
  completions: { total: number; success: number; failure: number }[] = [];

  constructor(queue: TaskQueue) {
    this.queue = queue;
    this.completions = queue.map((entry) => ({
      total: entry.count,
      success: 0,
      failure: 0,
    }));
  }

  get task(): Task | undefined {
    const id = this.queue[this.index]?.task;
    return id && TASKS[id];
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(succeeded: boolean): void {
    if (this.task === undefined) {
      return;
    }
    const completions = this.completions[this.index];
    if (succeeded) {
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
}
