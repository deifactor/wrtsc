import { makeAutoObservable } from "mobx";

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

export class Stats {
  combat: Stat;
  ruinsExploration: Stat;

  constructor() {
    makeAutoObservable(this);
    this.combat = new Stat("Combat");
    this.ruinsExploration = new Stat("Ruins Exploration");
  }

  statList(): Stat[] {
    return [this.combat, this.ruinsExploration];
  }
}
