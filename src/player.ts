import { makeAutoObservable } from "mobx";
import { Task } from "./task";
import { Zone, ZoneKind } from "./zone";

const INITIAL_ENERGY = 5000;

export class Player {
  readonly stats: Record<StatId, Stat>;
  readonly resources: Record<ResourceId, Resource>;
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  private _totalEnergy: number = INITIAL_ENERGY;

  constructor(json?: PlayerJSON) {
    this.stats = {
      combat: new Stat("Combat", "normal", json?.stats.combat),
      ruinsExploration: new Stat(
        "Ruins Exploration",
        "progress",
        json?.stats.ruinsExploration
      ),
      patrolRoutesObserved: new Stat(
        "Patrol Routes Observed",
        "progress",
        json?.stats.patrolRoutesObserved
      ),
    };
    this.resources = {
      ruinsBatteries: new Resource("Wreckage Batteries", () =>
        Math.floor(Math.sqrt(this.stats.ruinsExploration.level))
      ),
      ruinsWeapons: new Resource("Salvageable Weaponry", () =>
        Math.floor(this.stats.ruinsExploration.level / 10)
      ),
    };

    this.startLoop();

    makeAutoObservable(this);
  }

  clone(): Player {
    return new Player(this.save());
  }

  get energy(): number {
    return this._energy;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  addEnergy(amount: number) {
    this._energy += amount;
    this._totalEnergy += amount;
  }

  removeEnergy(amount: number) {
    this._energy -= amount;
  }

  /** Invoked whenevew the time loop restarts. */
  startLoop() {
    for (const resource of Object.values(this.resources)) {
      resource.startLoop();
    }
    this._energy = INITIAL_ENERGY;
    this._totalEnergy = INITIAL_ENERGY;
  }

  save(): PlayerJSON {
    const stats: Partial<Record<StatId, StatJSON>> = {};
    STAT_IDS.map((id) => (stats[id] = this.stats[id]));
    return { stats: stats as Record<StatId, StatJSON> };
  }

  /** The 'stats' that are actually progress elements for the given zone. */
  zoneProgress(zone: Zone): Stat[] {
    return zone.progressStats.map((id) => this.stats[id]);
  }

  perform(task: Task) {
    task.extraPerform(this);
    Object.entries(task.requiredResources).map(([res, value]) => {
      this.resources[res as ResourceId].current -= value;
    });
  }

  canPerform(task: Task): boolean {
    return (
      Object.entries(task.requiredStats).every(
        ([id, min]) => this.stats[id as StatId].level >= min
      ) &&
      Object.entries(task.requiredResources).every(
        ([id, min]) => this.resources[id as ResourceId].current >= min
      ) &&
      task.extraCheck(this)
    );
  }
}

export const STAT_IDS = [
  "combat",
  "ruinsExploration",
  "patrolRoutesObserved",
] as const;
export type StatId = typeof STAT_IDS[number];
export type Stats = Record<StatId, Stat>;

export type StatKind = "normal" | "progress";

export class Stat {
  // Stores the amount to the next level, not total XP.
  name: string;
  xp: number = 0;
  level: number = 0;
  kind: StatKind;
  maxLevel?: number;

  constructor(name: string, kind: StatKind, json?: StatJSON) {
    this.name = name;
    this.kind = kind;
    this.maxLevel = kind == "normal" ? undefined : 100;
    if (json) {
      this.xp = json.xp;
      this.level = json.level;
    }
    makeAutoObservable(this);
  }

  get totalToNextLevel(): number {
    return (this.level + 1) * 1024;
  }

  addXp(amount: number) {
    if (this.atMaxLevel) {
      return;
    }
    this.xp += amount;
    while (this.xp >= this.totalToNextLevel) {
      this.xp -= this.totalToNextLevel;
      this.level++;
      if (this.atMaxLevel) {
        this.xp = 0;
        return;
      }
    }
  }

  get atMaxLevel(): boolean {
    return this.maxLevel !== undefined && this.level >= this.maxLevel;
  }

  save(): StatJSON {
    return {
      xp: this.xp,
      level: this.level,
    };
  }
}

export type PlayerJSON = {
  stats: Record<StatId, StatJSON>;
};

export type StatJSON = {
  xp: number;
  level: number;
};

export const RESOURCE_IDS = ["ruinsBatteries", "ruinsWeapons"] as const;
export type ResourceId = typeof RESOURCE_IDS[number];
export type Resources = Record<ResourceId, Resource>;

/**
 * A Resource is something in the world that the player 'harvests' over the
 * course of the loop. The current count of each resource resets on loop start,
 * but the maximum doesn't.
 */
export class Resource {
  readonly name: string;
  current: number = 0;
  max: () => number;

  constructor(name: string, max: () => number) {
    this.name = name;
    this.max = max;
    makeAutoObservable(this);
  }

  startLoop() {
    this.current = this.max();
  }
}
