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
import { entries, keys, mapValues } from "./records";

export type ResourcesView = Record<
  ResourceId,
  { amount: number; visible: boolean }
>;
export type FlagsView = Record<LoopFlagId, boolean>;
export type ProgressView = Record<
  ProgressId,
  { level: number; xp: number; totalToNextLevel: number; visible: boolean }
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
  const visibles = findVisibles(engine);
  return {
    resources: mapValues(engine.resources, (amount, id) => {
      return {
        amount,
        visible: visibles.resources.has(id),
      };
    }),
    // mapping the identity is just cloning
    flags: mapValues(engine.flags, (flag) => flag),
    progress: mapValues(engine.progress, (level, id) => ({
      level: level.level,
      xp: level.xp,
      totalToNextLevel: level.totalToNextLevel,
      visible: visibles.progresses.has(id),
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
 * True if we should even allow the player to add this task to the queue. This
 * should only return false if there is no possible way for this task to succeed.
 */
function canAddToQueue(engine: Engine, task: Task): boolean {
  // Zero max iterations means it's impossible.
  if (task.maxIterations && task.maxIterations(engine) === 0) {
    return false;
  }
  // Check progress against the minima. We can't check resources or flags because those vary.
  return entries(task.required.progress || {}).every(
    ([progress, min]) => engine.progress[progress].level >= min
  );
}

function findVisibles(engine: Engine): {
  resources: Set<ResourceId>;
  progresses: Set<ProgressId>;
} {
  const resources = new Set<ResourceId>();
  const progresses = new Set<ProgressId>();
  Object.values(TASKS)
    .filter((task) => task.visible(engine))
    .forEach((task) => {
      keys(task.required.resources || {}).forEach(
        resources.add.bind(resources)
      );
      keys(task.rewards.resources || {}).forEach(resources.add.bind(resources));
      keys(task.required.progress || {}).forEach(
        progresses.add.bind(progresses)
      );
      keys(task.rewards.progress || {}).forEach(
        progresses.add.bind(progresses)
      );
    });
  return { resources, progresses };
}
