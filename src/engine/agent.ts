import { Engine, getCost } from "./engine";
import {
  DISABLE_LOCKOUTS,
  DRAIN_TERACAPACITOR,
  EXPLORE_RUINS,
  HIJACK_SHIP,
  KILL_SCOUT,
  LINK_SENSOR_DRONES,
  OBSERVE_PATROL_ROUTES,
  SCAVENGE_BATTERIES,
  Task,
} from "./task";

export type Agent = (engine: Engine) => Task | undefined;

/** Performs the first agent that returns a non-undefined task. */
export function first(...agents: Agent[]): Agent {
  return (engine) => {
    for (const agent of agents) {
      const task = agent(engine);
      if (
        task &&
        getCost(engine, task) < engine.energy &&
        engine.canPerform(task)
      ) {
        return task;
      }
    }
  };
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
      getCost(engine, DRAIN_TERACAPACITOR) + getCost(engine, inner) >
        engine.energy &&
      engine.canPerform(DRAIN_TERACAPACITOR) &&
      DRAIN_TERACAPACITOR.rewards(engine).energy! >
        getCost(engine, DRAIN_TERACAPACITOR)
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
  return LINK_SENSOR_DRONES;
};

export const exploreRuins: Agent = (engine) => {
  if (engine.progress.ruinsExploration.level < 100) {
    return EXPLORE_RUINS;
  }
};

export const hijacker: Agent = (engine) => {
  if (engine.resources.unoccupiedShips) {
    return HIJACK_SHIP;
  } else if (engine.resources.scouts) {
    return KILL_SCOUT;
  }
};

export const observe: Agent = (engine) => {
  if (engine.progress.patrolRoutesObserved.level < 100) {
    return OBSERVE_PATROL_ROUTES;
  }
};

export const lockout: Agent = (engine) => DISABLE_LOCKOUTS;
