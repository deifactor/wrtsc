/**
 * A projection of the engine's state suitable for rendering by the UI. The APIs
 * defined here are guaranteed to *attempt* to not needlessly duplicate objects.
 */
import {
  QueueEngine,
  LoopFlagId,
  ResourceId,
  ProgressId,
  TaskId,
  TASKS,
  Task,
  Rewards,
} from "./engine";
import { SimulantId, SubroutineId, SUBROUTINE_IDS } from "./engine/simulant";
import { SkillId } from "./engine/skills";
import { ZoneId } from "./engine/zone";
import { entries, keys, mapValues } from "./records";

export type ResourcesView = Record<
  ResourceId,
  { amount: number; visible: boolean }
>;
export type FlagsView = Record<LoopFlagId, boolean>;
export type SkillView = Record<
  SkillId,
  { level: number; xp: number; totalToNextLevel: number; visible: boolean }
>;
export type ProgressView = Record<
  ProgressId,
  { level: number; xp: number; totalToNextLevel: number; visible: boolean }
>;
export type ScheduleView = {
  /** `completed` is the number of iterations of that task that has been completed. */
  tasks: {
    id: TaskId;
    count: number;
    success: number;
    failure: number;
  }[];
  currentTask?: {
    index: number;
    cost: number;
    progress: number;
  };
};
export type SimulantView = {
  unlockedSimulants: SimulantId[];
  unlockedSubroutines: SubroutineId[];
  availableSubroutines: SubroutineId[];
  freeXp: number;
};

/**
 * Fields here generally correspond to the fields on `Task` that are functions
 * of the engine state.
 */
export type TaskView = {
  id: TaskId;
  cost: number;
  visible: boolean;
  canAddToQueue: boolean;
  shortName: string;
  rewards: Rewards;
  maxIterations: number | undefined;
};

export type EngineView = {
  resources: ResourcesView;
  flags: FlagsView;
  progress: ProgressView;
  skills: SkillView;
  zoneId: ZoneId;
  energy: number;
  totalEnergy: number;
  combat: number;
  defense: number;
  currentHp: number;
  maxHp: number;
  schedule: ScheduleView;
  tasks: Record<TaskId, TaskView>;
  timeAcrossAllLoops: number;
  simulant: SimulantView;
};

export function project(engine: QueueEngine): EngineView {
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
    skills: mapValues(engine.skills, (skill) => ({
      level: skill.level,
      xp: skill.xp,
      totalToNextLevel: skill.totalToNextLevel,
      visible: true,
    })),
    combat: engine.combat,
    defense: engine.defense,
    currentHp: engine.currentHp,
    maxHp: engine.maxHp,
    zoneId: engine.zoneId,
    energy: engine.energy,
    totalEnergy: engine.totalEnergy,
    schedule: projectSchedule(engine),
    tasks: mapValues(TASKS, (task) => ({
      id: task.id,
      cost: engine.cost(task),
      visible: task.visible(engine),
      canAddToQueue: canAddToQueue(engine, task),
      shortName: task.shortName,
      rewards: task.rewards(engine),
      maxIterations: task.maxIterations && task.maxIterations(engine),
    })),
    timeAcrossAllLoops: engine.timeAcrossAllLoops,
    simulant: simulantView(engine),
  };
}

function projectSchedule(engine: QueueEngine): ScheduleView {
  const schedule = engine.schedule;
  const taskState = engine.taskState;
  const stats =
    taskState &&
    (function () {
      switch (taskState.kind) {
        case "normal":
          return {
            progress: taskState.energyTotal - taskState.energyLeft,
            cost: taskState.energyTotal,
          };
        case "combat":
          return {
            progress: taskState.hpTotal - taskState.hpLeft,
            cost: taskState.hpTotal,
          };
      }
    })();
  return {
    tasks: schedule.queue.map(({ task, count }, index) => ({
      id: task,
      count,
      success: schedule.completions[index].success,
      failure: schedule.completions[index].failure,
    })),
    currentTask: engine.task && {
      index: schedule.index!,
      ...stats!,
    },
  };
}

/**
 * True if we should even allow the player to add this task to the queue. This
 * should only return false if there is no possible way for this task to succeed.
 */
function canAddToQueue(engine: QueueEngine, task: Task): boolean {
  // Zero max iterations means it's impossible.
  if (task.maxIterations && task.maxIterations(engine) === 0) {
    return false;
  }
  // Check progress against the minima. We can't check resources or flags because those vary.
  return entries(task.required.progress || {}).every(
    ([progress, min]) => engine.progress[progress].level >= min
  );
}

function findVisibles(engine: QueueEngine): {
  resources: Set<ResourceId>;
  progresses: Set<ProgressId>;
} {
  const resources = new Set<ResourceId>();
  const progresses = new Set<ProgressId>();
  Object.values(TASKS)
    .filter((task) => task.visible(engine))
    .forEach((task) => {
      const rewards = task.rewards(engine);
      keys(task.required.resources || {}).forEach(
        resources.add.bind(resources)
      );
      keys(rewards.resources || {}).forEach(resources.add.bind(resources));
      keys(task.required.progress || {}).forEach(
        progresses.add.bind(progresses)
      );
      keys(rewards.progress || {}).forEach(progresses.add.bind(progresses));
    });
  return { resources, progresses };
}

function simulantView(engine: QueueEngine): SimulantView {
  return {
    unlockedSimulants: Array.from(engine.simulant.unlockedSimulants),
    unlockedSubroutines: Array.from(engine.simulant.unlocked),
    availableSubroutines: SUBROUTINE_IDS.filter((sub) =>
      engine.simulant.subroutineAvailable(sub)
    ),
    freeXp: engine.simulant.freeXp,
  };
}
