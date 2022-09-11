/**
 * Logic for the built-in predictor/simulator that shows the state of the player
 * after each task batch.
 */

import { Engine, getCost, tickTime, toEngineSave } from "./engine";
import { QueueSchedule } from "./schedule";
import { TaskQueue } from "./taskQueue";

export interface SimulationStep {
  ok: boolean;
  energy: number;
  hp: number;
}

export type SimulationResult = SimulationStep[];

export function simulate(
  engine: Engine<QueueSchedule>,
  tasks: TaskQueue
): SimulationResult {
  engine = new Engine(new QueueSchedule(tasks), toEngineSave(engine));
  const result: SimulationResult = [];
  while (engine.task) {
    // need to get the index *before* we tick, since that can advance the index.
    const index = engine.schedule.index!;
    const { ok } = tickTime(engine, Math.max(getCost(engine, engine.task), 1));
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
