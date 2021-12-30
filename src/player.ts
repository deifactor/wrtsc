import { makeAutoObservable } from "mobx";
import { Zone, ZoneKind } from "./zone";

export class Player {
  readonly stats: Record<StatName, Stat>;
  readonly resources: Record<ResourceName, Resource>;

  constructor(json?: PlayerJSON) {
    this.stats = {
      combat: new Stat("Combat", "normal", json?.stats.combat),
      ruinsExploration: new Stat(
        "Ruins Exploration",
        "progress",
        json?.stats.ruinsExploration
      ),
    };
    this.resources = {
      ruinsBatteries: new Resource("Wreckage Batteries"),
    };

    this.setResourceLimits();

    makeAutoObservable(this);
  }

  reset() {
    for (const resource of Object.values(this.resources)) {
      resource.reset();
    }
  }

  save(): PlayerJSON {
    const stats: Partial<Record<StatName, StatJSON>> = {};
    STAT_NAMES.map((name) => (stats[name] = this.stats[name]));
    return { stats: stats as Record<StatName, StatJSON> };
  }

  /** The 'stats' that are actually progress elements for the given zone. */
  zoneProgress(zone: Zone): Stat[] {
    return zone.progressStats.map((name) => this.stats[name]);
  }

  setResourceLimits() {
    this.resources.ruinsBatteries.max = this.stats.ruinsExploration.level;
  }
}

export const STAT_NAMES = ["combat", "ruinsExploration"] as const;
export type StatName = typeof STAT_NAMES[number];
export type Stats = Record<StatName, Stat>;

export type StatKind = "normal" | "progress";

export class Stat {
  // Stores the amount to the next level, not total XP.
  name: string;
  xp: number = 0;
  level: number = 0;
  kind: StatKind;
  maxLevel?: number;

  constructor(name: string, kind: StatKind, json?: StatJSON) {
    makeAutoObservable(this);
    this.name = name;
    this.kind = kind;
    this.maxLevel = kind == "normal" ? undefined : 100;
    if (json) {
      this.xp = json.xp;
      this.level = json.level;
    }
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
  stats: Record<StatName, StatJSON>;
};

export type StatJSON = {
  xp: number;
  level: number;
};

export const RESOURCE_NAMES = ["ruinsBatteries"] as const;
export type ResourceName = typeof RESOURCE_NAMES[number];
export type Resources = Record<ResourceName, Resource>;

/**
 * A Resource is something in the world that the player 'harvests' over the
 * course of the loop. The current count of each resource resets on loop start,
 * but the maximum doesn't.
 */
export class Resource {
  readonly name: string;
  current: number = 0;
  max: number = 0;

  constructor(name: string) {
    this.name = name;
    makeAutoObservable(this);
  }

  reset() {
    this.current = this.max;
  }
}
