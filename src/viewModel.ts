/**
 * A projection of the engine's state suitable for rendering by the UI. The APIs
 * defined here are guaranteed to *attempt* to not needlessly duplicate objects.
 */
import {
  Engine,
  LoopFlagId,
  ResourceId,
  ProgressId,
  TaskKind,
  TASKS,
  Task,
} from "./engine";
import { ZoneKind } from "./engine/zone";
import { entries, mapValues } from "./records";

export type ResourcesView = Record<ResourceId, { amount: number }>;
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

export type TaskView = {
  kind: TaskKind;
  cost: number;
  visible: boolean;
  canAddToQueue: boolean;
  shortName: string;
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
  tasks: Record<TaskKind, TaskView>;
};

export function project(engine: Engine): EngineView {
  return {
    resources: mapValues(engine.resources, (amount) => {
      return {
        amount,
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
    tasks: mapValues(TASKS, (task) => ({
      kind: task.kind,
      cost: task.cost(engine),
      visible: task.visible(engine),
      canAddToQueue: canAddToQueue(engine, task),
      shortName: task.shortName,
    })),
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

/**
 * True if we should even consider adding this to the queue. This doesn't
 * indicate that it will *succeed*
 */
function canAddToQueue(engine: Engine, task: Task): boolean {
  return entries(task.required.progress || {}).every(
    ([progress, min]) => engine.progress[progress].level >= min
  );
}
