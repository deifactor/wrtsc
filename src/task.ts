import { Player } from "./player";

export type TaskKind =
  | "exploreRuins"
  | "scavengeBatteries"
  | "scavengeWeapons"
  | "observePatrolRoutes";

const always = () => true;

/** A task, something that goes in the task queue. */
export type Task = Readonly<{
  readonly kind: TaskKind;
  name: string;
  // Cost in AEUs.
  baseCost: number;
  description: string;
  perform: (player: Player) => void;
  /**
   * Predicate that determines whether the action should be shown to the player.
   * Note that this doesn't mean the player can take it; see `enabled`.
   */
  visible: (player: Player) => boolean;
  /** Predicate indicating whether the action can be taken. */
  canPerform: (player: Player) => boolean;
}>;

/** A task serialized to JSON, for persisting in localStorage or similar. */
export interface TaskJson {
  kind: TaskKind;
}

export const EXPLORE_RUINS: Task = {
  kind: "exploreRuins",
  name: "Explore Ruins",
  baseCost: 20,
  description:
    "Current loadout insufficient for mission. Recommend recovering as much materiel as viable.",
  perform: ({ stats }: Player) => {
    stats.ruinsExploration.addXp(1024);
  },
  visible: () => true,
  canPerform: always,
};

export const SCAVENGE_BATTERIES: Task = {
  kind: "scavengeBatteries",
  name: "Scavenge Batteries",
  baseCost: 5,
  description:
    "Power source: located. Integration of power source will lead to loop extension.",
  perform: (player: Player) => {
    player.addEnergy(15);
    player.resources.ruinsBatteries.current -= 1;
  },
  visible: (player: Player) => player.resources.ruinsBatteries.max > 0,
  canPerform: (player: Player) => player.resources.ruinsBatteries.current > 0,
};

export const SCAVENGE_WEAPONS: Task = {
  kind: "scavengeWeapons",
  name: "Scavenge Weapons",
  baseCost: 5,
  description:
    "Onboard weaponry has suffered critical damage and requires repair from locally-available components.",
  perform: (player: Player) => {
    player.stats.combat.addXp(1024);
  },
  visible: (player: Player) => player.stats.ruinsExploration.level > 0,
  canPerform: always,
};

export const OBSERVE_PATROL_ROUTES: Task = {
  kind: "observePatrolRoutes",
  name: "Observe Patrol Routes",
  baseCost: 10,
  description:
    "Transit will require a ship. Humanity United patrol vessels appear to be searching for survivors. Recommend route observation to determine optimal hijack strategy.",
  perform: (player: Player) => {
    player.stats.patrolRoutesObserved.addXp(1024);
  },
  visible: (player) => player.stats.ruinsExploration.level >= 10,
  canPerform: always,
};

export const TASKS: Record<TaskKind, Task> = {
  exploreRuins: EXPLORE_RUINS,
  scavengeBatteries: SCAVENGE_BATTERIES,
  scavengeWeapons: SCAVENGE_WEAPONS,
  observePatrolRoutes: OBSERVE_PATROL_ROUTES,
};
