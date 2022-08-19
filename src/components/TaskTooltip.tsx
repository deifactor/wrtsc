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
import { useEngineSelector } from "../engineStore";

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
  const progressFrags = Object.entries(task.required.progress || {}).map(
    ([progress, min]) => `${min}% ${PROGRESS_NAME[progress as ProgressId]}`
  );
  const resourceFrags = Object.entries(task.required.resources || {}).map(
    ([resource, amount]) =>
      `${amount}x ${RESOURCES[resource as ResourceId].name}`
  );
  const frags = [...progressFrags, ...resourceFrags];
  const requiresSection = frags.length !== 0 && (
    <p>
      <strong>Requires</strong>:
      <ul>
        {frags.map((frag) => (
          <li>{frag}</li>
        ))}
      </ul>
    </p>
  );
  return (
    <div className="w-96 p-2 text-sm">
      <p className="font-bold">{task.name}</p>
      <p className="my-2">{task.description}</p>
      <p>
        <strong>Cost:</strong> {cost}
      </p>
      {requiresSection}
      {trainingSection}
      <hr className="border-gray-700 my-3" />
      <p className="text-xs mb-2 text-gray-400">{task.flavor}</p>
    </div>
  );
});
TaskTooltip.displayName = "TaskTooltip";
