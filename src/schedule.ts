import { makeAutoObservable } from 'mobx';
import { TaskQueue, TaskQueueIterator, TaskQueuePointer } from './taskQueue';

export interface Stats {
  completions: number
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

  private readonly iter: TaskQueueIterator;

  constructor(queue: TaskQueue) {
    this.queue = queue;
    this.iter = new TaskQueueIterator(this.queue);
    makeAutoObservable(this);
  }

  get entry(): TaskQueuePointer | undefined {
    return this.iter.peek();
  }

  completions(index: number): number {
    const { entry } = this;
    if (entry == null) {
      return this.queue.entry(index)!.count;
    }
    if (index < entry.index) {
      return this.queue.entry(index)!.count;
    } if (index === entry.index) {
      return entry.iteration;
    }
    return 0;
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(): void {
    this.iter.next();
  }
}
