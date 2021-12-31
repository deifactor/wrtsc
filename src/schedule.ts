import { action, makeAutoObservable } from "mobx";
import { Task } from "./task";
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
  timeOnTask: number = 0;

  private readonly iter: TaskQueueIterator;

  constructor(queue: TaskQueue) {
    this.queue = queue;
    this.iter = new TaskQueueIterator(this.queue);
    makeAutoObservable(this);
  }

  get task(): Task | undefined {
    return this.current?.task;
  }

  get current(): TaskQueuePointer | undefined {
    return this.iter.peek();
  }

  get taskDone(): boolean {
    return Boolean(this.task && this.timeOnTask >= this.task.baseCost);
  }

  completions(index: number): number {
    const { current } = this;
    if (current == null) {
      return this.queue.entry(index)!.count;
    }
    if (index < current.index) {
      return this.queue.entry(index)!.count;
    }
    if (index === current.index) {
      return current.iteration;
    }
    return 0;
  }

  /** Ticks the progress on the current task by the given amount. */
  tickTime(amount: number) {
    this.timeOnTask += amount;
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(): void {
    this.iter.next();
    this.timeOnTask = 0;
  }
}
