import { advanceTask, canPerform, Engine, getCost, tickTime } from "./engine";
import { Schedule } from "./schedule";
import {
  DISABLE_LOCKOUTS,
  DRAIN_TERACAPACITOR,
  EXPLORE_RUINS,
  LINK_SENSOR_DRONES,
  OBSERVE_PATROL_ROUTES,
  SCAVENGE_BATTERIES,
  Task,
  TaskId,
  TASKS,
  UNLOCK_SIMULANT,
} from "./task";

export type Agent = (engine: Engine) => Task | undefined;

/** Performs the first agent that returns a non-undefined task. */
export function first(...agents: Agent[]): Agent {
  return (engine) => {
    for (const agent of agents) {
      const task = agent(engine);
      if (task && willSucceed(engine, task.id)) {
        return task;
      } else {
      }
    }
  };
}

/**
 * Returns whether performing the given course of actions starting from the
 * engine *right now* will succeed.
 */
function willSucceed(engine: Engine, ...tasks: TaskId[]): boolean {
  if (!tasks.length) {
    return true;
  }
  // In the common case with a single task, we want to fall back to this to
  // avoid the expensive clone operation.
  if (tasks.length === 1 && TASKS[tasks[0]].kind === "normal") {
    return (
      getCost(engine, TASKS[tasks[0]]) <= engine.energy &&
      canPerform(engine, TASKS[tasks[0]])
    );
  }
  engine = JSON.parse(JSON.stringify(engine));
  let allSuccess = true;
  let iter = tasks[Symbol.iterator]();
  let schedule: Schedule = {
    next(): TaskId | undefined {
      const n = iter.next().value;
      return n;
    },
    recordResult(success: boolean) {
      allSuccess = allSuccess && success;
    },
  };
  advanceTask(engine, schedule);
  while (allSuccess && engine.taskState) {
    const { ok } = tickTime(engine, schedule, 1000);
    allSuccess = allSuccess && ok;
  }
  return allSuccess;
}

/** Performs the inner agent, but draining teracapacitors as necessary. */
export function withTeracapacitors(agent: Agent): Agent {
  return (engine) => {
    const inner = agent(engine);
    if (!inner) {
      return undefined;
    }
    // If the inner task would leave us unable to drain, then drain first.
    if (
      willSucceed(engine, "dischargeTeracapacitor") &&
      !willSucceed(engine, inner.id, "dischargeTeracapacitor")
    ) {
      return DRAIN_TERACAPACITOR;
    }
    return inner;
  };
}

export const scavengeBatteries: Agent = (engine) => {
  return SCAVENGE_BATTERIES;
};

export const linkDrones: Agent = (engine) => {
  if (
    engine.progress.ruinsExploration.level < 100 ||
    engine.progress.patrolRoutesObserved.level < 100
  ) {
    return LINK_SENSOR_DRONES;
  }
};

export const exploreRuins: Agent = (engine) => {
  if (engine.progress.ruinsExploration.level < 100) {
    return EXPLORE_RUINS;
  }
};

export const hijacker: Agent = (engine) => {
  if (engine.matterMode === "save") {
    return TASKS.matterWeaponry;
  }
  if (
    !willSucceed(engine, "eradicateScout", "eradicateScout") &&
    engine.matterMode !== "repair"
  ) {
    return TASKS.matterRepair;
  }
  return first(
    () => TASKS.eradicateScout,
    () => TASKS.hijackShip
  )(engine);
};

export const observe: Agent = (engine) => {
  if (engine.progress.patrolRoutesObserved.level < 100) {
    return OBSERVE_PATROL_ROUTES;
  }
};

export const unlockSimulant: Agent = (engine) => {
  if (!("simulantUnlocked" in engine.milestones)) {
    return UNLOCK_SIMULANT;
  }
};

export const lockout: Agent = (engine) => DISABLE_LOCKOUTS;
