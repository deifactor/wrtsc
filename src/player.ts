import { makeAutoObservable } from "mobx";
import { Task } from "./task";
import { Zone } from "./zone";

const INITIAL_ENERGY = 5000;

export class Player {
  readonly stats: Record<StatId, Stat>;
  readonly resources: Record<ResourceId, Resource>;
  readonly flags: Record<FlagId, boolean>;
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  private _totalEnergy: number = INITIAL_ENERGY;

  constructor(json?: PlayerJSON) {
    this.stats = {
      ruinsExploration: new Stat(
        "ruinsExploration",
        "progress",
        json?.stats.ruinsExploration
      ),
      patrolRoutesObserved: new Stat(
        "patrolRoutesObserved",
        "progress",
        json?.stats.patrolRoutesObserved
      ),
      qhLockout: new Stat("qhLockout", "progress", json?.stats.qhLockout),
    };
    this.resources = {
      ruinsBatteries: new Resource("ruinsBatteries", () =>
        Math.floor(this.stats.ruinsExploration.level / 4)
      ),
      ruinsWeapons: new Resource("ruinsWeapons", () =>
        Math.floor(this.stats.ruinsExploration.level / 8)
      ),
      qhLockoutAttempts: new Resource("qhLockoutAttempts", () => 5),
    };
    this.flags = {
      shipHijacked: false,
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

  get combat(): number {
    return (
      this.resources.ruinsWeapons.max() - this.resources.ruinsWeapons.current
    );
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
    for (const stat of Object.values(this.stats)) {
      if (stat.kind === "normal") {
        // XXX: gross hack
        stat.level = 0;
        stat.xp = 0;
      }
    }
    this.flags.shipHijacked = false;
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

  cost(task: Task): number {
    if (typeof task.cost === "number") {
      return task.cost;
    } else {
      return task.cost(this);
    }
  }

  perform(task: Task) {
    task.extraPerform(this);
    Object.entries(task.requiredResources).forEach(([res, value]) => {
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
      Object.entries(task.requiredFlags).every(
        ([id, value]) => this.flags[id as FlagId] === value
      ) &&
      task.extraCheck(this)
    );
  }

  /**
   * Whether the task can be added to the queue. This is true if there's *some*
   * conceivable world where the player can perform this task. So it skips over
   * flag checks and only checks against *max* resources.
   */
  canAddToQueue(task: Task): boolean {
    return (
      Object.entries(task.requiredStats).every(
        ([id, min]) => this.stats[id as StatId].level >= min
      ) &&
      Object.entries(task.requiredResources).every(
        ([id, min]) => this.resources[id as ResourceId].max() >= min
      )
    );
  }
}

export const STAT_IDS = [
  "ruinsExploration",
  "patrolRoutesObserved",
  "qhLockout",
] as const;
export type StatId = typeof STAT_IDS[number];
export type Stats = Record<StatId, Stat>;

export const STAT_NAME: Record<StatId, string> = {
  ruinsExploration: "Ruins Exploration",
  patrolRoutesObserved: "Patrol Routes Observed",
  qhLockout: "Ship Lockout Disabled",
};

export type StatKind = "normal" | "progress";

export class Stat {
  id: StatId;
  xp: number = 0;
  level: number = 0;
  kind: StatKind;
  maxLevel?: number;

  constructor(id: StatId, kind: StatKind, json?: StatJSON) {
    this.id = id;
    this.kind = kind;
    this.maxLevel = kind === "normal" ? undefined : 100;
    if (json) {
      this.xp = json.xp;
      this.level = json.level;
    }
    makeAutoObservable(this);
  }

  get name(): string {
    return STAT_NAME[this.id];
  }

  get totalToNextLevel(): number {
    return (Math.floor(this.level / 4) + 1) * 1024;
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

export const RESOURCE_IDS = [
  "ruinsBatteries",
  "ruinsWeapons",
  "qhLockoutAttempts",
] as const;
export type ResourceId = typeof RESOURCE_IDS[number];
export type Resources = Record<ResourceId, Resource>;

export const RESOURCE_NAME: Record<ResourceId, string> = {
  ruinsBatteries: "Ruins Batteries",
  ruinsWeapons: "Ruins Weapons",
  qhLockoutAttempts: "QH Lockout Attempts",
};

/**
 * A Resource is something in the world that the player 'harvests' over the
 * course of the loop. The current count of each resource resets on loop start,
 * but the maximum doesn't.
 */
export class Resource {
  readonly id: ResourceId;
  current: number = 0;
  max: () => number;

  constructor(id: ResourceId, max: () => number) {
    this.id = id;
    this.max = max;
    makeAutoObservable(this);
  }

  get name(): string {
    return RESOURCE_NAME[this.id];
  }

  startLoop() {
    this.current = this.max();
  }
}

export const FLAG_IDS = ["shipHijacked"];
/**
 * A Flag is basically a status that the player may or may not have. Flags can
 * be positive or negative.
 */
export type FlagId = typeof FLAG_IDS[number];
