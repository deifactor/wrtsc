import { Engine } from "./engine";

export type CombatStats = {
  offense: number;
  defense: number;
  hp: number;
};

/**
 * Damage dealt has the form `offense * scaler(offense / defense)`, where
 * `scaler` is some increasing function with the property that `scaler(0) = 0`,
 * `scaler(1) = 1`, and `scaler(infinity) = infinity`. This means that if your
 * offense is equal to their defense, you deal dps equal to your offense, which
 * is nice. This also means that increasing your offense increases DPS
 * *superlinearly*, which is a bit weird, but oh well.
 *
 * The baseline for offense/defense stats is 100.
 */

function advantageScaler(advantage: number): number {
  return Math.pow(advantage, 0.3);
}

/** How much damage per second the player deals to the task. */
export function dpsDealt(engine: Engine, taskStats: CombatStats): number {
  return engine.combat * advantageScaler(engine.combat / taskStats.defense);
}

/** How much damage per second the player takes to the task. */
export function dpsReceived(engine: Engine, taskStats: CombatStats): number {
  return (
    taskStats.offense * advantageScaler(taskStats.offense / engine.defense)
  );
}
