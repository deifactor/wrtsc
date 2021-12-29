import { makeAutoObservable } from "mobx";

export class Player {
  readonly stats: Record<StatName, Stat>;

  constructor() {
    this.stats = {
      combat: new Stat("Combat"),
      ruinsExploration: new Stat("Ruins Exploration"),
    };
    makeAutoObservable(this);
  }

  statList() {
    return [this.stats.combat, this.stats.ruinsExploration];
  }
}

export const STAT_NAMES = ["combat", "ruinsExploration"] as const;
export type StatName = typeof STAT_NAMES[number];
export type Stats = Record<StatName, Stat>;

export class Stat {
  // Stores the amount to the next level, not total XP.
  name: string;
  xp: number = 0;
  level: number = 0;

  constructor(name: string) {
    makeAutoObservable(this);
    this.name = name;
  }

  get totalToNextLevel(): number {
    return (this.level + 1) * 1024;
  }

  addXp(amount: number) {
    this.xp += amount;
    while (this.xp >= this.totalToNextLevel) {
      this.xp -= this.totalToNextLevel;
      this.level++;
    }
  }
}
