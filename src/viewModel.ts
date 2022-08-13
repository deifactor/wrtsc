/**
 * A projection of the engine's state suitable for rendering by the UI. The APIs
 * defined here are guaranteed to *attempt* to not needlessly duplicate objects.
 */
import { Engine, LoopFlagId, ResourceId, ProgressId, TaskKind } from "./engine";
import { ZoneKind } from "./engine/zone";

export type ResourcesView = Record<ResourceId, { amount: number; max: number }>;
export type FlagsView = Record<LoopFlagId, boolean>;
export type ProgressView = Record<
  ProgressId,
  { level: number; xp: number; totalToNextLevel: number }
>;
export type ScheduleView = {
  /** `completed` is the number of iterations of that task that has been completed. */
  tasks: { kind: TaskKind; count: number; completed: number }[];
  currentTask?: {
    index: number;
    iteration: number;
    cost: number;
    progress: number;
  };
};

export type EngineView = {
  resources: ResourcesView;
  flags: FlagsView;
  progress: ProgressView;
  zoneKind: ZoneKind;
  energy: number;
  totalEnergy: number;
  combat: number;
  schedule: ScheduleView;
};

export function project(engine: Engine): EngineView {
  return {
    resources: mapValues(engine.resources, (amount, resource) => {
      return {
        amount,
        max: engine.maxResource(resource),
      };
    }),
    // mapping the identity is just cloning
    flags: mapValues(engine.flags, (flag) => flag),
    progress: mapValues(engine.progress, (level) => ({
      level: level.level,
      xp: level.xp,
      totalToNextLevel: level.totalToNextLevel,
    })),
    combat: engine.combat,
    zoneKind: engine.zoneKind,
    energy: engine.energy,
    totalEnergy: engine.totalEnergy,
    schedule: projectSchedule(engine),
  };
}

function projectSchedule(engine: Engine): ScheduleView {
  const schedule = engine.schedule;
  return {
    tasks: schedule.queue.map(({ task, count }, index) => ({
      kind: task,
      count,
      completed: schedule.completions(index),
    })),
    currentTask: schedule.task && {
      index: schedule.task.index,
      cost: schedule.task.cost(engine),
      iteration: schedule.task.iteration,
      progress: schedule.task.cost(engine) - schedule.timeLeftOnTask,
    },
  };
}

/** Map a function over the values of a record. */
function mapValues<K extends string | number | symbol, U, V>(
  obj: Record<K, U>,
  func: (val: U, key: K) => V
): Record<K, V> {
  const mapped = {} as Record<K, V>;
  Object.entries(obj).forEach(([key, val]) => {
    mapped[key as K] = func(val as U, key as K);
  });
  return mapped;
}
