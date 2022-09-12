import { createSelector } from "@reduxjs/toolkit";
import { keys } from "../records";
import { RootState, useAppSelector } from "../store";
import { selectVisibleTasks, useEngineSelector } from "../worldStore";
import equal from "fast-deep-equal";
import {
  ProgressId,
  PROGRESS_NAME,
  totalToNextProgressLevel,
} from "../engine/player";
import { TASKS } from "../engine/task";

type Props = {
  id: ProgressId;
};
/**
 * What progress should we display to the player? We display a resource if some
 * visible task either requires or rewards the resource.
 */
const selectVisibleProgress = createSelector(
  selectVisibleTasks,
  (state: RootState) => state.world.engine,
  (tasks, engine) => {
    const visible = new Set<ProgressId>();
    for (const id of tasks) {
      keys(TASKS[id].required?.progress || {}).forEach((res) =>
        visible.add(res)
      );
      keys(TASKS[id].rewards(engine).progress || {}).forEach((res) =>
        visible.add(res)
      );
    }
    // Cast back to an array so we can
    return Array.from(visible);
  },
  {
    memoizeOptions: {
      resultEqualityCheck: equal,
    },
  }
);

export const ProgressDisplay = (props: Props) => {
  const { id } = props;
  const { level, xp } = useEngineSelector((engine) => engine.progress[id]);
  const visible = useAppSelector(selectVisibleProgress).includes(id);
  if (!visible) {
    return null;
  }
  let levelDisplay = level.toString() + "%";
  const progressPercent = Math.floor(
    (100 * xp) / totalToNextProgressLevel({ level, xp })
  );
  return (
    <div>
      <strong>{PROGRESS_NAME[id]}</strong>: {levelDisplay} ({progressPercent}
      %)
    </div>
  );
};
ProgressDisplay.displayName = "ProgresssDisplay";
