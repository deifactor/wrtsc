import { makeAutoObservable } from "mobx";
import { Task, TaskKind, TASKS } from "./task";

/** An entry in a task queue consists of a task and a number of times to repeat it. */
export interface TaskBatch {
  task: Task;
  count: number;
}

export type TaskQueuePointer = Task & {
  index: number;
  iteration: number;
  count: number;
};

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
    makeAutoObservable(this);
  }

  [Symbol.iterator](): TaskQueueIterator {
    return this;
  }

  peek(): TaskQueuePointer | undefined {
    const entry = this.queue.entry(this.index);
    if (entry == null) {
      return undefined;
    }
    return {
      index: this.index,
      iteration: this.iteration,
      count: entry.count,
      ...entry.task,
    };
  }

  next(): IteratorResult<TaskQueuePointer, undefined> {
    if (this.queue.length === 0) {
      return { done: true, value: undefined };
    }

    const value = this.peek();
    if (value == null) {
      return { value, done: true };
    }
    this.iteration += 1;
    if (this.iteration >= this.queue.entries[this.index].count) {
      this.index += 1;
      this.iteration = 0;
    }
    return { value, done: false };
  }
}

export class TaskQueue {
  entries: TaskBatch[];

  constructor() {
    this.entries = [];
    makeAutoObservable(this);
  }

  clone(): TaskQueue {
    const cloned = new TaskQueue();
    for (const task of this.taskIterator()) {
      cloned.push(task.kind);
    }
    return cloned;
  }

  /** An array accessor that will make MobX happy. */
  entry(idx: number): TaskBatch | undefined {
    return idx < this.entries.length ? this.entries[idx] : undefined;
  }

  taskIterator(): TaskQueueIterator {
    return new TaskQueueIterator(this);
  }

  push(kind: TaskKind): void {
    const lastEntry = this.entries[this.entries.length - 1];
    if (lastEntry?.task.kind === kind) {
      lastEntry.count += 1;
    } else {
      this.entries.push({ task: TASKS[kind], count: 1 });
    }
  }

  modifyCount(idx: number, amount: number): void {
    const entry = this.entry(idx);
    if (entry == null) {
      throw Error(
        `Tried to modify count of ${idx}, which is >= length ${this.length}`
      );
    }
    entry.count += amount;
    if (entry.count <= 0) {
      this.entries.splice(idx, 1);
    }
  }

  get length(): number {
    return this.entries.length;
  }
}
