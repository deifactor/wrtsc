import {
  TASKS,
  SKILL_NAME,
  ProgressId,
  PROGRESS_NAME,
  RESOURCES,
  ResourceId,
  TaskKind,
} from "../engine";
import React from "react";
import { useEngineSelector } from "../store";
import { entries } from "../records";

interface Props {
  kind: TaskKind;
}

export const TaskTooltip = React.memo(({ kind }: Props) => {
  const task = TASKS[kind];
  const cost = useEngineSelector((engine) => engine.tasks[kind].cost);
  const trainingSection = task.trainedSkills.length !== 0 && (
    <p>
      <strong>Trains:</strong>{" "}
      {task.trainedSkills.map((s) => SKILL_NAME[s]).join(", ")}
    </p>
  );

  const requiresFrags = [
    ...Object.entries(task.required.progress || {}).map(
      ([progress, min]) => `${min}% ${PROGRESS_NAME[progress as ProgressId]}`
    ),
    ...Object.entries(task.required.resources || {}).map(
      ([resource, amount]) =>
        `${amount}x ${RESOURCES[resource as ResourceId].name}`
    ),
  ];
  const requiresSection = requiresFrags.length !== 0 && (
    <div>
      <strong>Requires</strong>:
      <ul>
        {requiresFrags.map((frag, index) => (
          <li key={index}>{frag}</li>
        ))}
      </ul>
    </div>
  );

  const rewardsFrags = [
    ...entries(task.rewards.progress || {}).map(
      ([progress]) => `${PROGRESS_NAME[progress]} progress`
    ),
    ...entries(task.rewards.resources || {}).map(
      ([resource, amount]) => `${amount}x ${RESOURCES[resource].name}`
    ),
  ];
  const rewardsSection = rewardsFrags.length !== 0 && (
    <div>
      <strong>Rewards</strong>:
      <ul>
        {rewardsFrags.map((frag, index) => (
          <li key={index}>{frag}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className="w-96 p-2 text-sm">
      <p className="font-bold">{task.name}</p>
      <p className="my-2">{task.description}</p>
      <p>
        <strong>Cost:</strong> {cost}
      </p>
      {requiresSection}
      {rewardsSection}
      {trainingSection}
      <hr className="border-gray-700 my-3" />
      <p className="text-xs mb-2 text-gray-400">{task.flavor}</p>
    </div>
  );
});
TaskTooltip.displayName = "TaskTooltip";
