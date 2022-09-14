import { keys, makeValues } from "../records";
import { Engine } from "./engine";

export const SIMULANT_IDS = ["tekhne", "ergon", "enkephalos"] as const;
export type SimulantId = typeof SIMULANT_IDS[number];

export const SUBROUTINE_IDS = [
  "burstClock",
  "burstClockBeta",
  "burstClockGamma",
  "electrovore",
  "capacitiveCoupler",
  "metametacognition",
  "selfOptimizing",
  "combatAccelerator",
] as const;
/** Corresponds to a 'talent' in a more fantasy-ish game. */
export type SubroutineId = typeof SUBROUTINE_IDS[number];

export const SIMULANT_TO_SUBROUTINE: Record<SimulantId, SubroutineId[]> = {
  tekhne: [
    "burstClock",
    "burstClockBeta",
    "burstClockGamma",
    "combatAccelerator",
  ],
  ergon: ["electrovore", "capacitiveCoupler"],
  enkephalos: ["selfOptimizing", "metametacognition"],
};

const COSTS: Record<SubroutineId, number> = {
  // This one costs a very small amount because we expect it to be the first the
  // player ever gets.
  burstClock: 64,
  burstClockBeta: 16384,
  burstClockGamma: 65536,
  capacitiveCoupler: 24576,
  selfOptimizing: 4096,
  electrovore: 16384,
  combatAccelerator: 32768,
  metametacognition: 32768,
};

export interface SimulantState {
  freeXp: number;
  unlocked: Partial<Record<SubroutineId, true>>;
}

export function makeSimulantState(save?: SimulantSave): SimulantState {
  return {
    freeXp: save?.freeXp || 0,
    unlocked: makeValues(save?.unlocked || [], () => true),
  };
}

export function getSubroutineCost(id: SubroutineId): number {
  return COSTS[id];
}

export function toSimulantSave(simulant: SimulantState): SimulantSave {
  return {
    freeXp: simulant.freeXp,
    unlocked: Array.from(keys(simulant.unlocked)),
  };
}

export function unlockSubroutine(engine: Engine, id: SubroutineId) {
  if (!isSubroutineAvailable(engine, id)) {
    throw new Error(`Tried to unlock ${id} but it wasn't available`);
  }
  engine.simulant.unlocked[id] = true;
  engine.simulant.freeXp -= getSubroutineCost(id);
}

/** Whether the given subroutine is unlocked. */
export function isSubroutineAvailable({ simulant }: Engine, id: SubroutineId) {
  return simulant.freeXp >= getSubroutineCost(id);
}

export type SimulantSave = {
  freeXp: number;
  unlocked: SubroutineId[];
};

/** Having `selfOptimizing` divides all costs by this amount. */
export function selfOptimizingDivider(engine: Engine): number {
  return (
    1 + Math.log2(1 + Math.pow(engine.timeAcrossAllLoops / 1000, 0.7) / 131072)
  );
}
