import { entries, keys, makeValues, mapValues } from "../records";
import { damagePerEnergy } from "./combat";

import {
  Progress,
  LoopFlagId,
  ResourceId,
  ProgressId,
  RESOURCES,
  RESOURCE_IDS,
  MilestoneId,
  PROGRESS_IDS,
  addProgressXp,
} from "./player";
import { QueueSchedule, Schedule } from "./schedule";
import { Simulant, SimulantSave } from "./simulant";
import { Skill, SkillId, SKILL_IDS } from "./skills";
import { CombatTask, NormalTask, Task, TASKS } from "./task";
import { TaskQueue } from "./taskQueue";
import { RUINS, ZoneId } from "./zone";

export const STORAGE_KEY = "save";

export type TaskFailureReason = "outOfEnergy" | "taskFailed" | "outOfHp";

export type TickResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      reason: TaskFailureReason;
    };

export type SimulationStep = {
  ok: boolean;
  energy: number;
  hp: number;
};

export type SimulationResult = SimulationStep[];

const INITIAL_ENERGY = 5000;

/** The current task and how far in it we are. */
export type TaskState =
  | {
      kind: "normal";
      energyTotal: number;
      energyLeft: number;
      task: NormalTask;
    }
  | {
      kind: "combat";
      hpTotal: number;
      hpLeft: number;
      task: CombatTask;
    };

/** Contains all of the game state. If this was MVC, this would correspond to the model. */
export class Engine<ScheduleT extends Schedule = Schedule> {
  // Saved player state.
  readonly progress: Record<ProgressId, Progress>;
  readonly skills: Record<SkillId, Skill>;
  // We use a Record<T, true> here instead of a Set because Sets aren't serializable.
  milestones: Partial<Record<MilestoneId, true>>;
  timeAcrossAllLoops: number;
  simulant: Simulant;

  schedule: ScheduleT;
  taskState: TaskState | undefined = undefined;

  // Unsaved player state that's adjusted as we go through a loop.
  resources: Record<ResourceId, number>;
  flags: Record<LoopFlagId, boolean>;
  zoneId: ZoneId = RUINS.id;

  /** Time, in milliseconds, since the start of the loop. */
  private _timeInLoop: number = 0;

  private _energy: number = INITIAL_ENERGY;
  /** The total amount of energy acquired in this loop. */
  private _totalEnergy: number = INITIAL_ENERGY;

  currentHp!: number;

  constructor(schedule: ScheduleT, save?: EngineSave) {
    this.progress = makeValues(PROGRESS_IDS, () => ({ level: 0, xp: 0 }));
    this.skills = makeValues(SKILL_IDS, () => ({ level: 0, xp: 0 }));
    this.milestones = {};
    this.simulant = new Simulant(save?.simulant);
    this.timeAcrossAllLoops = 0;
    if (save) {
      entries(save.progress).forEach(([id, { xp, level }]) => {
        this.progress[id].xp = xp;
        this.progress[id].level = level;
      });
      entries(save.skills).forEach(([id, { xp, level }]) => {
        this.skills[id].xp = xp;
        this.skills[id].level = level;
      });
      for (const milestone of save.milestones) {
        this.milestones[milestone] = true;
      }
      this.timeAcrossAllLoops = save.timeAcrossAllLoops;
    }
    this.flags = {
      shipHijacked: false,
    };
    this.resources = makeValues(RESOURCE_IDS, (res) =>
      RESOURCES[res].initial(this)
    );
    this.schedule = schedule;
    this.startLoop(schedule);
  }

  get energy(): number {
    return this._energy;
  }

  get totalEnergy(): number {
    return this._totalEnergy;
  }

  get timeInLoop(): number {
    return this._timeInLoop;
  }

  get task(): Task | undefined {
    return this.taskState?.task;
  }

  /** Restart the time loop. */
  startLoop(schedule?: ScheduleT) {
    this._timeInLoop = 0;
    this._energy = this._totalEnergy = INITIAL_ENERGY;
    for (const resource of RESOURCE_IDS) {
      this.resources[resource] = RESOURCES[resource].initial(this);
    }
    this.flags = {
      shipHijacked: false,
    };
    if (schedule) {
      this.schedule = schedule;
    }
    this.currentHp = this.maxHp;
    this.next(undefined);
  }

  /** Energy cost of the task after applying any global cost modifiers. */
  cost(task: Task) {
    switch (task.kind) {
      case "normal":
        return task.baseCost(this);
      case "combat":
        return task.stats.hp / damagePerEnergy(this, task.stats).dealt;
    }
  }

  private perform(task: Task) {
    const rewards = task.rewards(this);
    entries(task.required.resources || {}).forEach(([res, value]) => {
      this.resources[res] -= value;
    });
    entries(rewards.resources || {}).forEach(([res, value]) => {
      this.resources[res] += value;
    });
    entries(rewards.progress || {}).forEach(([progress, xp]) => {
      addProgressXp(
        this.progress[progress],
        xp * (1 + Math.log2(1 + this.skills.ergodicity.level / 128))
      );
    });
    entries(rewards.flags || {}).forEach(([flag, value]) => {
      this.flags[flag] = value;
    });
    entries(task.trainedSkills).forEach(([id, xp]) => {
      const metaMult = 1 + Math.log2(1 + this.skills.metacognition.level / 256);
      addProgressXp(this.skills[id], xp * metaMult);
      addProgressXp(this.skills.metacognition, (xp * metaMult) / 4);
    });
    rewards.energy && this.addEnergy(rewards.energy);
    rewards.simulant && this.simulant.unlockedSimulants.add(rewards.simulant);
    task.extraPerform(this);
  }

  canPerform(task: Task): boolean {
    return (
      entries(task.required.progress || {}).every(
        ([id, min]) => this.progress[id].level >= min
      ) &&
      entries(task.required.resources || {}).every(
        ([id, min]) => this.resources[id] >= min
      ) &&
      entries(task.required.flags || {}).every(
        ([id, value]) => this.flags[id] === value
      )
    );
  }

  get combat(): number {
    return 100 * (1 + Math.log2(1 + this.skills.lethality.level / 16));
  }

  get defense(): number {
    return 100 * Math.log2(1 + this.skills.lethality.level / 32);
  }

  get maxHp(): number {
    return 256;
  }

  /**
   * 1 millisecond will spend this many AEUs. This is effectively an increase in
   * tickspeed; you can't do more things, but you can do them faster.
   */
  energyPerMs(): number {
    return this.simulant.unlocked.has("burstClock")
      ? Math.max(1, 2 - this.timeInLoop / 16384)
      : 1;
  }

  /**
   * Advance the simulation by this many milliseconds. Returns an indication of
   * whether there was an error in the simulation.
   *
   * - `taskFailed` indicates that the task failed to be performed.
   * - `outOfEnergy` indicates that the player ran out in the middle of a task.
   *
   * Note that this will automatically 'slice' the tick into smaller ticks if it
   * would cross a boundary. E.g., if there are 50 ms left on a task and you
   * give it a 100ms tick then it'll do a 50ms and then another 50ms.
   */
  tickTime(duration: number): TickResult {
    // Amount of energy we're allowed to spend in this tick.
    const energyPerMs = this.energyPerMs();
    let unspentEnergy = Math.floor(duration * energyPerMs);
    while (unspentEnergy > 0 && this.energy > 0) {
      if (!this.task) {
        return { ok: true };
      }
      if (!this.canPerform(this.task)) {
        this.next(false);
        return { ok: false, reason: "taskFailed" };
      }
      if (!this.taskState) {
        throw new Error("timeLeftOnTask unset despite task being set");
      }
      // Spend energy until we run out or something happens.
      const spent = Math.min(this.energyToNextEvent(), unspentEnergy);
      this.spendEnergy(spent);

      if (this.currentHp <= 0) {
        this.schedule.recordResult(false);
        return { ok: false, reason: "outOfHp" };
      }

      if (this.taskFinished()) {
        this.perform(this.task);
        this.next(true);
      }
      unspentEnergy -= spent;
    }

    if (this.energy <= 0 && this.task) {
      this.schedule.recordResult(false);
      return { ok: false, reason: "outOfEnergy" };
    }
    return { ok: true };
  }

  /** Advances the schedule and records the success of the most recent task. */
  private next(success: boolean | undefined) {
    if (success !== undefined) {
      this.schedule.recordResult(success);
    }
    const next = this.schedule.next(this);
    if (!next) {
      this.taskState = undefined;
      return;
    }
    const task = TASKS[next];
    switch (task.kind) {
      case "normal":
        this.taskState = {
          kind: "normal",
          task,
          energyLeft: this.cost(task),
          energyTotal: this.cost(task),
        };
        return;
      case "combat":
        this.taskState = {
          kind: "combat",
          task,
          hpLeft: task.stats.hp,
          hpTotal: task.stats.hp,
        };
    }
  }

  taskFinished(): boolean {
    const state = this.taskState!;
    switch (state.kind) {
      case "normal":
        return state.energyLeft <= 0;
      case "combat":
        return state.hpLeft <= 0;
    }
  }

  private addEnergy(amount: number) {
    amount *=
      1 + Math.log(1 + this.skills.energyTransfer.level / 128) / Math.log(2);
    amount = Math.floor(amount);
    this._energy += amount;
    this._totalEnergy += amount;
  }

  /**
   * Does everything associated with spending energy: increases the time
   * counters and simulant XP.
   */
  private spendEnergy(amount: number) {
    const energyPerMs = this.energyPerMs();
    const time = amount / energyPerMs;
    this._energy -= amount;
    this._timeInLoop += amount / energyPerMs;
    this.timeAcrossAllLoops += amount / energyPerMs;
    // Only add simulant XP if there's actually an unlocked simulant.
    if (this.simulant.unlockedSimulants.size !== 0) {
      this.simulant.addXp(amount / 1000);
    }
    const taskState = this.taskState!;
    switch (taskState.kind) {
      case "normal":
        taskState.energyLeft -= amount;
        break;
      case "combat":
        const { dealt, received } = damagePerEnergy(this, taskState.task.stats);
        taskState.hpLeft -= time * dealt;
        this.currentHp -= time * received;
        // floating-point math strikes again; this prevents the player from
        // surviving something that should have reduced them to exactly 0 HP.
        if (Math.abs(this.currentHp) < 0.001) {
          this.currentHp = 0;
        }
        break;
    }
  }

  /**
   * Amount of energy that's necessary to spend until something interesting
   * happens that changes the simulation: we run out of energy or the current
   * task finishes.
   */
  energyToNextEvent(): number {
    const taskState = this.taskState!;
    let toTaskCompletion;
    switch (taskState.kind) {
      case "normal":
        toTaskCompletion = taskState.energyLeft;
        break;
      case "combat":
        toTaskCompletion =
          taskState.hpLeft / damagePerEnergy(this, taskState.task.stats).dealt;
        break;
    }
    return Math.min(this.energy, toTaskCompletion);
  }

  simulation(tasks: TaskQueue): SimulationResult {
    // Deep-copy the engine into a new state
    const sim = new Engine(new QueueSchedule(tasks), this.toSave());
    const result: SimulationResult = [];
    while (sim.task) {
      // need to get the index *before* we tick, since that can advance the index.
      const index = sim.schedule.index!;
      const { ok } = sim.tickTime(Math.max(sim.cost(sim.task), 1));
      result[index] = {
        ok: ok,
        energy: sim.energy,
        hp: sim.currentHp,
      };
      if (!ok) {
        break;
      }
    }
    return result;
  }

  toSave(): EngineSave {
    return {
      progress: mapValues(this.progress, (progress) => ({
        xp: progress.xp,
        level: progress.level,
      })),
      skills: mapValues(this.skills, (skill) => ({
        xp: skill.xp,
        level: skill.level,
      })),
      milestones: Array.from(keys(this.milestones)),
      timeAcrossAllLoops: this.timeAcrossAllLoops,
      simulant: this.simulant.toSave(),
    };
  }
}

export type QueueEngine = Engine<QueueSchedule>;

export type EngineSave = {
  progress: Record<ProgressId, { xp: number; level: number }>;
  skills: Record<SkillId, { xp: number; level: number }>;
  milestones: MilestoneId[];
  simulant: SimulantSave;
  timeAcrossAllLoops: number;
};
