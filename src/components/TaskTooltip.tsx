import {
  TASKS,
  ProgressId,
  PROGRESS_NAME,
  RESOURCES,
  ResourceId,
  TaskKind,
  Requirements,
  Rewards,
} from "../engine";
import React, { ReactNode } from "react";
import { useEngineSelector } from "../store";
import { entries } from "../records";
import { SKILL_NAME } from "../engine/skills";
import { Tooltip } from "./common/Tooltip";

interface Props {
  kind: TaskKind;
}

function taskMetadata({
  id,
  cost,
  requirements,
  rewards,
}: {
  id: TaskKind;
  cost: number;
  requirements: Requirements | undefined;
  rewards: Rewards | undefined;
}): Record<string, ReactNode> {
  const task = TASKS[id];
  const metadata: Record<string, ReactNode> = {};

  metadata["Cost"] = cost;
  metadata["Trains"] = entries(task.trainedSkills)
    .map(([id, xp]) => `${xp} ${SKILL_NAME[id]} XP`)
    .join(", ");

  if (requirements) {
    const requiresFrags = [
      ...Object.entries(requirements.progress || {}).map(
        ([progress, min]) => `${min}% ${PROGRESS_NAME[progress as ProgressId]}`
      ),
      ...Object.entries(requirements.resources || {}).map(
        ([resource, amount]) =>
          `${amount}x ${RESOURCES[resource as ResourceId].name}`
      ),
    ];
    metadata["Requires"] = requiresFrags.length !== 0 && (
      <ul>
        {requiresFrags.map((frag, index) => (
          <li key={index}>{frag}</li>
        ))}
      </ul>
    );
  }

  if (rewards) {
    const rewardsFrags = [
      ...entries(rewards.progress || {}).map(
        ([progress]) => `${PROGRESS_NAME[progress]} progress`
      ),
      ...entries(rewards.resources || {}).map(
        ([resource, amount]) => `${amount}x ${RESOURCES[resource].name}`
      ),
    ];
    metadata["Rewards"] = rewardsFrags.length !== 0 && (
      <ul>
        {rewardsFrags.map((frag, index) => (
          <li key={index}>{frag}</li>
        ))}
      </ul>
    );
  }

  return metadata;
}

export const TaskTooltip = React.memo(({ kind }: Props) => {
  const task = TASKS[kind];
  const cost = useEngineSelector((engine) => engine.tasks[kind].cost);
  const rewards = useEngineSelector((engine) => engine.tasks[kind].rewards);

  const metadata = taskMetadata({
    id: kind,
    cost,
    requirements: task.required,
    rewards,
  });

  return (
    <Tooltip title={task.name} metadata={metadata} lore={task.flavor}>
      {task.description}
    </Tooltip>
  );
});
TaskTooltip.displayName = "TaskTooltip";
