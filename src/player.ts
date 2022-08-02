import {
  ClassConstructor,
  Exclude,
  instanceToInstance,
  plainToInstance,
  Transform,
} from "class-transformer";
import { makeAutoObservable } from "mobx";
import { Task } from "./task";
import { RUINS, Zone, ZoneKind, ZONES } from "./zone";
const INITIAL_ENERGY = 5000;

function _convertRecord<T>(cls: ClassConstructor<T>) {
  return function (params: { value: any }): Record<string, T> {
    const obj = params.value;
    Object.keys(obj).forEach((key) => {
      obj[key] = plainToInstance(cls, obj[key]);
    });
    return obj as Record<string, T>;
  };
}

export class Level {
  public xp: number = 0;
  public level: number = 0;

  constructor() {
    makeAutoObservable(this);
  }

  get totalToNextLevel(): number {
    return (Math.floor(this.level / 4) + 1) * 1024;
  }

  addXp(xp: number) {
    this.xp += xp;
    while (this.xp >= this.totalToNextLevel) {
      this.xp -= this.totalToNextLevel;
      this.level++;
    }
  }
}

export class Player {
  @Transform(_convertRecord(Level), { toClassOnly: true })
  readonly stats: Record<StatId, Level>;
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneKind: ZoneKind = RUINS.kind;
  @Exclude()
  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  @Exclude()
  private _totalEnergy: number = INITIAL_ENERGY;

  constructor() {
    this.stats = {
      ruinsExploration: new Level(),
      patrolRoutesObserved: new Level(),
      qhLockout: new Level(),
    };
    this.resources = {
      ruinsBatteries: 0,
      ruinsWeapons: 0,
      qhLockoutAttempts: 0,
    };
    this.flags = {
      shipHijacked: false,
    };
    this.startLoop();

    makeAutoObservable(this);
  }

  clone(): Player {
    return instanceToInstance(this);
  }

  get zone(): Zone {
    return ZONES[this.zoneKind];
  }

  get energy(): number {
    return this._energy;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  get combat(): number {
    return this.maxResource("ruinsWeapons") - this.resources.ruinsWeapons;
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
    this.resources = {
      ruinsBatteries: this.maxResource("ruinsBatteries"),
      ruinsWeapons: this.maxResource("ruinsWeapons"),
      qhLockoutAttempts: this.maxResource("qhLockoutAttempts"),
    };
    this.flags = {
      shipHijacked: false,
    };
    this._energy = INITIAL_ENERGY;
    this._totalEnergy = INITIAL_ENERGY;
    this.zoneKind = RUINS.kind;
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
      this.resources[res as ResourceId] -= value;
    });
  }

  canPerform(task: Task): boolean {
    return (
      Object.entries(task.requiredStats).every(
        ([id, min]) => this.stats[id as StatId].level >= min
      ) &&
      Object.entries(task.requiredResources).every(
        ([id, min]) => this.resources[id as ResourceId] >= min
      ) &&
      Object.entries(task.requiredLoopFlags).every(
        ([id, value]) => this.flags[id as LoopFlagId] === value
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
        ([id, min]) => this.maxResource(id as ResourceId) >= min
      )
    );
  }

  maxResource(resource: ResourceId): number {
    switch (resource) {
      case "ruinsBatteries":
        return Math.floor(this.stats.ruinsExploration.level / 4);
      case "ruinsWeapons":
        return Math.floor(this.stats.ruinsExploration.level / 8);
      case "qhLockoutAttempts":
        return 12;
    }
  }
}

export const SKILL_IDS = [
  "lethality",
  "ergodicity",
  "evasion",
  // Note that this is not explicitly trained; anything that trains any skill
  // trains it.
  "metacognition",
  // Note that this is not explicitly trained; anything that recharges energy
  // implicitly trains it.
  "energyTransfer",
] as const;
export type SkillId = typeof SKILL_IDS[number];
export type Skills = Record<SkillId, Skill>;

export const SKILL_NAME: Record<SkillId, string> = {
  lethality: "Lethality",
  ergodicity: "Ergodicity",
  evasion: "Evasion",
  metacognition: "Metacognition",
  energyTransfer: "Energy Transfer",
};

type Skill = { xp: number; level: number };
export const STAT_IDS = [
  "ruinsExploration",
  "patrolRoutesObserved",
  "qhLockout",
] as const;
export type StatId = typeof STAT_IDS[number];

export const STAT_NAME: Record<StatId, string> = {
  ruinsExploration: "Ruins Exploration",
  patrolRoutesObserved: "Patrol Routes Observed",
  qhLockout: "Ship Lockout Disabled",
};

export const RESOURCE_IDS = [
  "ruinsBatteries",
  "ruinsWeapons",
  "qhLockoutAttempts",
] as const;
export type ResourceId = typeof RESOURCE_IDS[number];

export const RESOURCE_NAME: Record<ResourceId, string> = {
  ruinsBatteries: "Ruins Batteries",
  ruinsWeapons: "Ruins Weapons",
  qhLockoutAttempts: "QH Lockout Attempts",
};

export const LOOP_FLAG_IDS = ["shipHijacked"];
/**
 * A LoopFlag is basically a status that the player may or may not have. Flags
 * can be positive or negative.
 */
export type LoopFlagId = typeof LOOP_FLAG_IDS[number];
