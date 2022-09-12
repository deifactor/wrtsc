import { createSelector } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import React from "react";
import { ResourceId, RESOURCES, TASKS } from "../engine";
import { keys } from "../records";
import { RootState, useAppSelector } from "../store";
import { selectVisibleTasks, useEngineSelector } from "../worldStore";

type Props = {
  id: ResourceId;
};

/**
 * What resources should we display to the player? We display a resource if some
 * visible task either requires or rewards the resource.
 */
const selectVisibleResources = createSelector(
  selectVisibleTasks,
  (state: RootState) => state.world.engine,
  (tasks, engine) => {
    const visible = new Set<ResourceId>();
    for (const id of tasks) {
      keys(TASKS[id].required?.resources || {}).forEach((res) =>
        visible.add(res)
      );
      keys(TASKS[id].rewards(engine).resources || {}).forEach((res) =>
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

export const ResourceDisplay = React.memo((props: Props) => {
  const { id } = props;
  const visible = useAppSelector(selectVisibleResources).includes(id);
  const amount = useEngineSelector((engine) => engine.resources[id]);
  if (!visible) {
    return null;
  }
  return (
    <div>
      <strong>{RESOURCES[id].name}</strong>: {amount}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
