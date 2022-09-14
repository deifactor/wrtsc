export interface Progress {
  xp: number;
  level: number;
}

export function totalToNextProgressLevel(progress: Progress): number {
  return (progress.level + 1) * 1024;
}

export function addProgressXp(progress: Progress, xp: number) {
  progress.xp += xp;
  while (progress.xp >= totalToNextProgressLevel(progress)) {
    progress.xp -= totalToNextProgressLevel(progress);
    progress.level++;
  }
  if (progress.level >= 100) {
    progress.level = 100;
    progress.xp = 0;
  }
}

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

export const LOOP_FLAG_IDS = ["shipHijacked"] as const;
/**
 * A LoopFlag is basically a status that the player may or may not have. Flags
 * can be positive or negative.
 */
export type LoopFlagId = typeof LOOP_FLAG_IDS[number];

export const MILESTONE_IDS = ["shipHijacked", "simulantUnlocked"] as const;
/**
 * A `Milestone` indicates that the player has done something in particular.
 * Think 'acheivement', but not necessarily something that actually corresponds
 * to a conventional one. These unlock stories, make things visible, etc.
 */
export type MilestoneId = typeof MILESTONE_IDS[number];
