/**
 * Logic for the built-in predictor/simulator that shows the state of the player
 * after each task batch.
 */

import {
  Engine,
  makeEngine,
  startLoop,
  tickTime,
  toEngineSave,
} from "./engine";
import { QueueSchedule } from "./schedule";
import { TaskQueue } from "./taskQueue";

export interface SimulationStep {
  ok: boolean;
  energy?: number;
  hp?: number;
}

export type SimulationResult = SimulationStep[];

export function simulate(engine: Engine, tasks: TaskQueue): SimulationResult {
  const schedule = new QueueSchedule(tasks);
  engine = makeEngine(toEngineSave(engine));
  startLoop(engine, schedule);
  while (engine.taskState) {
    // We use a fixed tick interval because some things (like burst clock) can
    // change over the course of a task.
    const { ok } = tickTime(engine, schedule, 25);
    if (!ok) {
      break;
    }
  }
  return tasks.map((_batch, index) => ({
    ok:
      schedule.completions[index] && schedule.completions[index].failure === 0,
    ...schedule.metrics[index],
  }));
}
