/**
 * This is a very minimal file, but it gives us the approach to complicate
 * things later, add more stats, and so on.
 */
import { Engine } from "./engine";

export type CombatStats = {
  /** Damage dealt per 1 kAEU (1 second, before tickspeed/etc). */
  offense: number;
  hp: number;
};

/** Damage dealt/received by the player per 1 AEU spent. */
export function damagePerEnergy(
  engine: Engine,
  taskStats: CombatStats
): { dealt: number; received: number } {
  const armorMultiplier =
    taskStats.offense / (taskStats.offense + engine.defense);
  return {
    dealt: engine.combat / 1000,
    received: (taskStats.offense * armorMultiplier) / 1000,
  };
}
