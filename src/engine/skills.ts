import { Engine } from "./engine";

/** Skills are trained by performing tasks that are marked as training that skill. */
export interface Skill {
  xp: number;
  level: number;
}

export function totalToNextSkillLevel(skill: Skill): number {
  return (skill.level + 1) * 1024;
}

export function addSkillXp(skill: Skill, xp: number) {
  skill.xp += xp;
  while (skill.xp >= totalToNextSkillLevel(skill)) {
    skill.xp -= totalToNextSkillLevel(skill);
    skill.level++;
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
