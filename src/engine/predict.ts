/**
 * Logic for the built-in predictor/simulator that shows the state of the player
 * after each task batch.
 */

import { Engine, getCost, makeEngine, tickTime, toEngineSave } from "./engine";
import { QueueSchedule } from "./schedule";
import { TaskQueue } from "./taskQueue";

export interface SimulationStep {
  ok: boolean;
  energy: number;
  hp: number;
}

export type SimulationResult = SimulationStep[];

export function simulate(engine: Engine, tasks: TaskQueue): SimulationResult {
  const schedule = new QueueSchedule(tasks);
  engine = makeEngine(schedule, toEngineSave(engine));
  const result: SimulationResult = [];
  while (engine.taskState?.task) {
    // need to get the index *before* we tick, since that can advance the index.
    const index = schedule.index!;
    const { ok } = tickTime(
      engine,
      schedule,
      Math.max(getCost(engine, engine.taskState?.task), 1)
    );
    result[index] = {
      ok: ok,
      energy: engine.energy,
      hp: engine.currentHp,
    };
    if (!ok) {
      break;
    }
  }
  return result;
}
