import { keys, makeValues } from "../records";
import { Engine } from "./engine";

export const SIMULANT_IDS = ["tekhne", "ergon"] as const;
export type SimulantId = typeof SIMULANT_IDS[number];

export const SUBROUTINE_IDS = ["burstClock"] as const;
/** Corresponds to a 'talent' in a more fantasy-ish game. */
export type SubroutineId = typeof SUBROUTINE_IDS[number];

export const SIMULANT_TO_SUBROUTINE: Record<SimulantId, SubroutineId[]> = {
  tekhne: ["burstClock"],
  ergon: [],
};

const COSTS: Record<SubroutineId, number> = {
  // This one costs a very small amount because we expect it to be the first the
  // player ever gets.
  burstClock: 64,
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
