import { Engine } from "./engine";
import {
  DRAIN_TERACAPACITOR,
  EXPLORE_RUINS,
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
      if (task) {
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
    if (engine.resources.teracapacitors === 0) {
      return inner;
    }
    // If draining teracapacitors would
    if (DRAIN_TERACAPACITOR.cost(engine) + inner.cost(engine) > engine.energy) {
      return DRAIN_TERACAPACITOR;
    }
    return inner;
  };
}

export const scavengeBatteries: Agent = (engine) => {
  if (engine.resources.ruinsBatteries > 0) {
    return SCAVENGE_BATTERIES;
  }
};

export const linkDrones: Agent = (engine) => {
  if (
    engine.resources.unlinkedSensorDrones > 0 &&
    LINK_SENSOR_DRONES.cost(engine) <= engine.energy
  ) {
    return LINK_SENSOR_DRONES;
  }
};

export const exploreRuins: Agent = (engine) => {
  if (
    EXPLORE_RUINS.cost(engine) <= engine.energy &&
    engine.progress.ruinsExploration.level < 100
  ) {
    return EXPLORE_RUINS;
  }
};

export const observe: Agent = (engine) => {
  if (OBSERVE_PATROL_ROUTES.cost(engine) <= engine.energy) {
    return OBSERVE_PATROL_ROUTES;
  }
};
