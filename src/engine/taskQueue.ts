import { Task, TaskKind, TASKS } from "./task";
import { produce } from "immer";

/** An entry in a task queue consists of a task and a number of times to repeat it. */
export interface TaskBatch {
  readonly task: TaskKind;
  readonly count: number;
}

export type TaskQueuePointer = Readonly<
  Task & {
    index: number;
    iteration: number;
    count: number;
  }
>;

export type TaskQueue = readonly TaskBatch[];

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
      iteration: this.iteration,
      count: entry.count,
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

/**
 * Push a task to the end of the queue. If the last task in the queue is the
 * given kind, increments its count by 1 instead.
 */
export const pushTaskToQueue = produce<TaskQueue, [TaskKind]>((queue, kind) => {
  const len = queue.length;
  if (len !== 0 && queue[len - 1].task === kind) {
    queue[queue.length - 1].count++;
  } else {
    queue.push({ task: kind, count: 1 });
  }
});

/**
 * { Modify the task count of the index-th task by amount. If this would result
 * in a negative amount, removes it.
 */
export const adjustTaskCount = produce<
  TaskQueue,
  [{ index: number; amount: number }]
>((queue, { index, amount }) => {
  checkBounds(queue, index);
  const entry = queue[index];
  entry.count += amount;
  if (entry.count <= 0) {
    queue.splice(index, 1);
  }
});

/**
 * Move the task at `from` to the position `to`. Throws if either of those is
 * out of bounds.
 */
export const moveTask = produce<TaskQueue, [{ from: number; to: number }]>(
  (queue, { from, to }) => {
    checkBounds(queue, from);
    checkBounds(queue, to);
    // Yes, this works no matter what `from` and `to` are. Unit test it anyway
    // though.
    const entry = queue[from];
    queue.splice(from, 1);
    queue.splice(to, 0, entry);
  }
);

/** Removes the task at index `index`. */
export const removeTask = produce<TaskQueue, [number]>((queue, index) => {
  checkBounds(queue, index);
  queue.splice(index, 1);
});

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
