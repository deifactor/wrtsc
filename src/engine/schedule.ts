import { Player } from "./player";
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
  readonly player: Player;
  timeLeftOnTask: number = 0;

  private readonly iter: TaskQueueIterator;

  constructor(queue: TaskQueue, player: Player) {
    this.queue = queue;
    this.player = player;
    this.iter = new TaskQueueIterator(this.queue);
    this.timeLeftOnTask = this.task ? player.cost(this.task) : 0;
  }

  get task(): TaskQueuePointer | undefined {
    return this.iter.peek;
  }

  get taskDone(): boolean {
    return Boolean(this.task && this.timeLeftOnTask === 0);
  }

  completions(index: number): number {
    const { task } = this;
    if (task == null) {
      return this.queue.entry(index)!.count;
    }
    if (index < task.index) {
      return this.queue.entry(index)!.count;
    }
    if (index === task.index) {
      return task.iteration;
    }
    return 0;
  }

  /**
   * Ticks the progress on the current task by the given amount. Returns the
   * amount that was actually ticked.
   */
  tickTime(amount: number): number {
    amount = Math.min(amount, this.timeLeftOnTask);
    this.timeLeftOnTask -= amount;
    return amount;
  }

  /**
   * Advances to the next task. Argument indicates whether the current task
   * succeeded or not.
   */
  next(): void {
    this.iter.next();
    this.timeLeftOnTask = this.task ? this.player.cost(this.task) : 0;
  }
}
