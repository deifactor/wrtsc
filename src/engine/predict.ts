/**
 * Logic for the built-in predictor/simulator that shows the state of the player
 * after each task batch.
 */

import {
  Engine,
  getCost,
  makeEngine,
  startLoop,
  tickTime,
  toEngineSave,
} from "./engine";
import { QueueSchedule } from "./schedule";
import { TASKS } from "./task";
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
    // need to get the index *before* we tick, since that can advance the index.
    const { ok } = tickTime(
      engine,
      schedule,
      Math.max(Math.ceil(getCost(engine, TASKS[engine.taskState?.task])), 1)
    );
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
