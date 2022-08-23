import { Engine } from "./engine";

/** Skills are trained by performing tasks that are marked as training that skill. */
export class Skill {
  public xp: number = 0;
  public level: number = 0;

  get totalToNextLevel(): number {
    return (this.level + 1) * 1024;
  }

  addXp(xp: number) {
    this.xp += xp;
    while (this.xp >= this.totalToNextLevel) {
      this.xp -= this.totalToNextLevel;
      this.level++;
    }
  }
}
export const SKILL_IDS = [
  "lethality",
  "ergodicity",
  "datalink",
  "spatial",
  // Note that this is not explicitly trained; anything that trains any skill
  // trains it.
  "metacognition",
  // Gives a bonus to anything that adds energy to the player.
  "energyTransfer",
] as const;
export type SkillId = typeof SKILL_IDS[number];
export type Skills = Record<SkillId, Skill>;

export const SKILL_NAME: Record<SkillId, string> = {
  datalink: "Datalink",
  lethality: "Lethality",
  ergodicity: "Ergodicity",
  spatial: "Spatial Awareness",
  metacognition: "Metacognition",
  energyTransfer: "Energy Transfer",
};

export function datalinkBonus(engine: Engine): number {
  return Math.log2(1 + engine.skills.datalink.level / 128);
}
