import { Player } from "./player";

export type TaskKind =
  | "explore-ruins"
  | "scavenge-batteries"
  | "scavenge-weapons";

/**
 * A task, something that goes in the task queue.
 */
export interface Task {
  kind: TaskKind;
  name: string;
  // Cost in AEUs.
  baseCost: number;
  description: string;
  perform: (player: Player) => void;
  unlocked: (player: Player) => boolean;
}

/**
 * A task serialized to JSON, for persisting in localStorage or similar.
 */
export interface TaskJson {
  kind: TaskKind;
}

export const EXPLORE_RUINS: Task = {
  kind: "explore-ruins",
  name: "Explore Ruins",
  baseCost: 20,
  description:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  perform: (player: Player) => {
    player.stats.ruinsExploration.addXp(1024);
  },
  unlocked: () => true,
};

export const SCAVENGE_BATTERIES: Task = {
  kind: "scavenge-batteries",
  name: "Scavenge Batteries",
  baseCost: 5,
  description:
    "Power source: located. Integration of power source will lead to loop extension.",
  perform: (player: Player) => {
    // TODO: not implemented yet!
  },
  unlocked: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const SCAVENGE_WEAPONS: Task = {
  kind: "scavenge-weapons",
  name: "Scavenge Weapons",
  baseCost: 5,
  description:
    "Onboard weaponry has suffered critical damage and requires repair from locally-available components.",
  perform: (player: Player) => {
    player.stats.combat.addXp(1024);
  },
  unlocked: (player: Player) => player.stats.ruinsExploration.level > 0,
};

export const ALL_TASKS = [EXPLORE_RUINS, SCAVENGE_BATTERIES, SCAVENGE_WEAPONS];

export function fromJSON(obj: TaskJson): Task {
  switch (obj.kind) {
    case "explore-ruins":
      return EXPLORE_RUINS;
    case "scavenge-batteries":
      return SCAVENGE_BATTERIES;
    case "scavenge-weapons":
      return SCAVENGE_WEAPONS;
    // no default
  }
}

export function toJSON(task: Task): TaskJson {
  switch (task.kind) {
    default:
      return { kind: task.kind };
  }
}
