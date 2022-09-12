/**
 * A projection of the engine's state suitable for rendering by the UI. The APIs
 * defined here are guaranteed to *attempt* to not needlessly duplicate objects.
 */
import {
  Engine,
  LoopFlagId,
  ResourceId,
  ProgressId,
  TaskId,
  TASKS,
  Task,
  Rewards,
  totalToNextProgressLevel,
  getCost,
} from "./engine";
import { getCombat, getDefense, getMaxHp } from "./engine/combat";
import {
  isSubroutineAvailable,
  SimulantId,
  SubroutineId,
  SUBROUTINE_IDS,
} from "./engine/simulant";
import { SkillId, totalToNextSkillLevel } from "./engine/skills";
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
  tasks: Record<TaskId, TaskView>;
  timeAcrossAllLoops: number;
  simulant: SimulantView;
  currentTask:
    | {
        cost: number;
        progress: number;
      }
    | undefined;
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
      totalToNextLevel: totalToNextProgressLevel(level),
      visible: visibles.progresses.has(id),
    })),
    skills: mapValues(engine.skills, (skill) => ({
      level: skill.level,
      xp: skill.xp,
      totalToNextLevel: totalToNextSkillLevel(skill),
      visible: true,
    })),
    combat: getCombat(engine),
    defense: getDefense(engine),
    currentHp: engine.currentHp,
    maxHp: getMaxHp(engine),
    zoneId: engine.zoneId,
    energy: engine.energy,
    totalEnergy: engine.totalEnergy,
    tasks: mapValues(TASKS, (task) => ({
      id: task.id,
      cost: getCost(engine, task),
      visible: task.visible(engine),
      canAddToQueue: canAddToQueue(engine, task),
      shortName: task.shortName,
      rewards: task.rewards(engine),
      maxIterations: task.maxIterations && task.maxIterations(engine),
    })),
    timeAcrossAllLoops: engine.timeAcrossAllLoops,
    simulant: simulantView(engine),
    currentTask: getCurrentTask(engine),
  };
}

function getCurrentTask(engine: Engine) {
  const { taskState } = engine;
  if (!taskState) {
    return undefined;
  }
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

function simulantView(engine: Engine): SimulantView {
  return {
    unlockedSimulants: Array.from(keys(engine.simulant.unlockedSimulants)),
    unlockedSubroutines: Array.from(keys(engine.simulant.unlocked)),
    availableSubroutines: SUBROUTINE_IDS.filter((sub) =>
      isSubroutineAvailable(engine, sub)
    ),
    freeXp: engine.simulant.freeXp,
  };
}
