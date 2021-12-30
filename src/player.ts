import { makeAutoObservable } from "mobx";
import { Zone, ZoneKind } from "./zone";

export class Player {
  readonly stats: Record<StatName, Stat>;

  constructor() {
    this.stats = {
      combat: new Stat("Combat"),
      ruinsExploration: new Stat("Ruins Exploration", "progress"),
    };
    makeAutoObservable(this);
  }

  statList() {
    return [this.stats.combat];
  }

  save(): PlayerJSON {
    const stats: Partial<Record<StatName, StatJSON>> = {};
    STAT_NAMES.map((name) => (stats[name] = this.stats[name]));
    return { stats: stats as Record<StatName, StatJSON> };
  }

  load(json: PlayerJSON) {
    STAT_NAMES.map((name) => this.stats[name].load(json.stats[name]));
  }

  /** The 'stats' that are actually progress elements for the given zone. */
  zoneProgress(zone: Zone): Stat[] {
    return zone.progressStats.map((name) => this.stats[name]);
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

  constructor(name: string, kind: StatKind = "normal") {
    makeAutoObservable(this);
    this.name = name;
    this.kind = kind;
    this.maxLevel = kind == "normal" ? undefined : 100;
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

  load(json: StatJSON) {
    this.xp = json.xp;
    this.level = json.level;
  }
}

export type PlayerJSON = {
  stats: Record<StatName, StatJSON>;
};

export type StatJSON = {
  xp: number;
  level: number;
};
