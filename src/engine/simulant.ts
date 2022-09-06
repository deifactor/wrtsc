export const SIMULANT_IDS = ["tekhne", "ergon"] as const;
export type SimulantId = typeof SIMULANT_IDS[number];

export const SUBROUTINE_IDS = ["burstClock"] as const;
/** Corresponds to a 'talent' in a more fantasy-ish game. */
export type SubroutineId = typeof SUBROUTINE_IDS[number];

export const SIMULANT_TO_SUBROUTINE: Record<SimulantId, SubroutineId[]> = {
  tekhne: ["burstClock"],
  ergon: [],
};

const REQUIREMENTS: Record<SubroutineId, SubroutineId[]> = {
  burstClock: [],
};

const COSTS: Record<SubroutineId, number> = {
  // This one costs a very small amount because we expect it to be the first the
  // player ever gets.
  burstClock: 64,
};

export class Simulant {
  freeXp: number = 0;
  unlockedSimulants: Set<SimulantId> = new Set();
  unlocked: Set<SubroutineId> = new Set();

  constructor(save?: SimulantSave) {
    this.unlockedSimulants = new Set(save?.unlockedSimulants || []);
    this.unlocked = new Set(save?.unlocked || []);
  }

  cost(id: SubroutineId): number {
    return COSTS[id];
  }

  toSave(): SimulantSave {
    return {
      unlockedSimulants: Array.from(this.unlockedSimulants),
      unlocked: Array.from(this.unlocked),
    };
  }

  visibleSubroutines(id: SimulantId): SubroutineId[] {
    return SIMULANT_TO_SUBROUTINE[id].filter((sub) =>
      REQUIREMENTS[sub].every((req) => this.unlocked.has(req))
    );
  }

  unlock(id: SubroutineId) {
    if (!this.subroutineAvailable(id)) {
      throw new Error(`Tried to unlock ${id} but it wasn't available`);
    }
    this.unlocked.add(id);
  }

  /** Whether the given subroutine is unlocked. */
  subroutineAvailable(id: SubroutineId) {
    const subToSim: Record<SubroutineId, SimulantId> = {
      burstClock: "tekhne",
    };
    return this.unlockedSimulants.has(subToSim[id]);
  }

  /** Adds free XP, to be spent on unlocked levels. XP is added at 1 per *second*. */
  addXp(xp: number) {
    this.freeXp += xp;
  }
}

export type SimulantSave = {
  unlockedSimulants: SimulantId[];
  unlocked: SubroutineId[];
};
