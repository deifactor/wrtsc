export class Progress {
  public xp: number = 0;
  public level: number = 0;

  get totalToNextLevel(): number {
    return (Math.floor(this.level / 4) + 1) * 1024;
  }

  addXp(xp: number) {
    this.xp += xp;
    while (this.xp >= this.totalToNextLevel) {
      this.xp -= this.totalToNextLevel;
      this.level++;
    }
    if (this.level >= 100) {
      this.level = 100;
      this.xp = 0;
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
export const PROGRESS_IDS = [
  "ruinsExploration",
  "patrolRoutesObserved",
  "qhLockout",
] as const;
export type ProgressId = typeof PROGRESS_IDS[number];

export const PROGRESS_NAME: Record<ProgressId, string> = {
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

export const LOOP_FLAG_IDS = ["shipHijacked"] as const;
/**
 * A LoopFlag is basically a status that the player may or may not have. Flags
 * can be positive or negative.
 */
export type LoopFlagId = typeof LOOP_FLAG_IDS[number];
