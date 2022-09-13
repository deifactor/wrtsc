import { Engine } from "./engine";
import { TaskId } from "./task";
import { TaskQueue } from "./taskQueue";

/**
 * State of the engine after completing a task. This is useful for things like
 * the predictor and the speedrunner. We use the word "metrics" because "state"
 * tends to mean things like the Redux store.
 */
export interface EngineMetrics {
  hp: number;
  energy: number;
}

export interface Schedule {
  next(engine: Engine): TaskId | undefined;
  recordResult(success: boolean, metrics: EngineMetrics): void;
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
  metrics: EngineMetrics[];

  constructor(queue: TaskQueue) {
    this.queue = queue;
    this.completions = this.queue.map((batch) => ({
      total: batch.count,
      success: 0,
      failure: 0,
    }));
    this.metrics = [];
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
      this.iteration = 0;
    }
    console.log("at ", this.index, this.iteration);
    return this.queue[this.index]?.task;
  }

  recordResult(success: boolean, metrics: EngineMetrics) {
    if (this.index === undefined) {
      throw new Error("Can't record success when we haven't even started");
    } else if (this.index >= this.queue.length) {
      throw new Error(
        `Can't record when we're done (index ${this.index} queue length ${this.queue.length})`
      );
    } else {
      const completions = this.completions[this.index];
      this.metrics[this.index] = metrics;
      if (success) {
        completions.success++;
      } else {
        completions.failure++;
      }
    }
  }
}
