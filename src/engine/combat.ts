/**
 * This is a very minimal file, but it gives us the approach to complicate
 * things later, add more stats, and so on.
 */
import { Engine, getEnergyPerMs } from "./engine";

export type CombatStats = {
  /** Damage dealt per 1 kAEU (1 second, before tickspeed/etc). */
  offense: number;
  defense: number;
  hp: number;
};

/** Damage dealt/received by the player per 1 AEU spent. */
export function damagePerEnergy(
  engine: Engine,
  taskStats: CombatStats
): { dealt: number; received: number } {
  let dealt =
    (getCombat(engine) *
      armorMultiplier(getCombat(engine), taskStats.defense)) /
    1000;
  let received =
    (taskStats.offense *
      armorMultiplier(taskStats.offense, getDefense(engine))) /
    1000;
  if ("combatAccelerator" in engine.simulant.unlocked) {
    dealt *= getEnergyPerMs(engine);
  }
  return { dealt, received };
}

function armorMultiplier(offense: number, defense: number) {
  return Math.pow(offense / (offense + defense), 2);
}

export function getCombat(engine: Engine): number {
  return (
    100 *
    (1 + Math.log2(1 + engine.skills.lethality.level / 16)) *
    (1 + Math.log2(1 + engine.resources.weaponizedMatter / 256))
  );
}

export function getDefense(engine: Engine): number {
  return 100 * Math.log2(1 + engine.skills.spatial.level / 32);
}

export function getMaxHp(_engine: Engine): number {
  return 256;
}
