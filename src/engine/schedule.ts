import { Engine } from "./engine";
import { TaskId } from "./task";
import { TaskQueue } from "./taskQueue";

export interface Schedule {
  next(engine: Engine): TaskId | undefined;
  recordResult(success: boolean): void;
  restart(): void;
}

export class QueueSchedule {
  queue: TaskQueue;
  /** The index of the task batch we're in. */
  index: number | undefined = undefined;
  /**
   * Which iteration within the batch. Zero-indexed, so 0 means we're working on
   * the first iteration.
   */
  iteration = 0;
  completions: { total: number; success: number; failure: number }[];

  constructor(queue: TaskQueue) {
    this.queue = queue;
    this.completions = this.queue.map((batch) => ({
      total: batch.count,
      success: 0,
      failure: 0,
    }));
  }

  next(): TaskId | undefined {
    if (this.index === undefined) {
      this.index = 0;
      this.iteration = 0;
      return this.queue[this.index]?.task;
    }

    if (this.index >= this.queue.length) {
      return undefined;
    }

    this.iteration++;
    if (this.iteration >= this.queue[this.index].count) {
      this.index++;
    }
    return this.queue[this.index]?.task;
  }

  recordResult(success: boolean) {
    if (this.index === undefined) {
      throw new Error("Can't record success when we haven't even started");
    } else if (this.index >= this.queue.length) {
      throw new Error(
        `Can't record when we're done (index ${this.index} queue length ${this.queue.length})`
      );
    } else {
      const completions = this.completions[this.index];
      if (success) {
        completions.success++;
      } else {
        completions.failure++;
      }
    }
  }

  restart() {
    this.index = undefined;
    this.iteration = 0;
    this.completions = this.queue.map((batch) => ({
      total: batch.count,
      success: 0,
      failure: 0,
    }));
  }
}
