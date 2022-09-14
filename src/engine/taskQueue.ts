import { Task, TaskId, TASKS } from "./task";

/** An entry in a task queue consists of a task and a number of times to repeat it. */
export interface TaskBatch {
  task: TaskId;
  count: number;
}

export type TaskQueuePointer = Readonly<
  Task & {
    index: number;
  }
>;

export type TaskQueue = TaskBatch[];

/**
 * Iterates over the entries in a task queue.
 *
 * Note that once this has finished, modifying the task queue further is not supported.
 */
export class TaskQueueIterator implements IterableIterator<TaskQueuePointer> {
  private readonly queue: TaskQueue;

  private index = 0;
  private iteration = 0;

  constructor(queue: TaskQueue) {
    this.queue = queue;
  }

  [Symbol.iterator](): TaskQueueIterator {
    return this;
  }

  get peek(): TaskQueuePointer | undefined {
    const entry = this.queue[this.index];
    if (!entry) {
      return undefined;
    }
    return {
      index: this.index,
      ...TASKS[entry.task],
    };
  }

  next(): IteratorResult<TaskQueuePointer, undefined> {
    if (this.queue.length === 0) {
      return { done: true, value: undefined };
    }

    const value = this.peek;
    if (value == null) {
      return { value, done: true };
    }
    this.iteration += 1;
    if (this.iteration >= this.queue[this.index].count) {
      this.index += 1;
      this.iteration = 0;
    }
    return { value, done: false };
  }
}

export function taskIterator(queue: TaskQueue): TaskQueueIterator {
  return new TaskQueueIterator(queue);
}
