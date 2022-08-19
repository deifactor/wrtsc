import { Button } from "./common/Button";
import { Engine, SimulationStep, Task, TASKS } from "../engine";
import classNames from "classnames";
import { ICONS, TaskIcon } from "./common/TaskIcon";
import { FaArrowDown, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import { RiDeleteBackFill } from "react-icons/ri";
import * as q from "../engine/taskQueue";
import React from "react";
import { TaskTooltip } from "./TaskTooltip";
import { useEngineSelector } from "../engineStore";
import { entries } from "../records";

/**
 * True if we should even consider adding this to the queue. This doesn't
 * indicate that it will *succeed*
 */
function canAddToQueue(engine: Engine, task: Task): boolean {
  return entries(task.required.progress || {}).every(
    ([progress, min]) => engine.progress[progress].level >= min
  );
}

interface Props {
  className?: string;
  queue: q.TaskQueue;
  setQueue: (queue: q.TaskQueue) => void;
}

const TaskQueueEditor = React.memo((props: Props) => {
  const { queue, setQueue, className } = props;
  const tasks = queue.map((entry, index) => {
    const incrementCount = (): void =>
      setQueue(q.adjustTaskCount(queue, { index, amount: 1 }));
    const decrementCount = (): void =>
      setQueue(q.adjustTaskCount(queue, { index, amount: -1 }));
    const moveUp = (): void =>
      setQueue(q.moveTask(queue, { from: index, to: index - 1 }));
    const moveDown = (): void =>
      setQueue(q.moveTask(queue, { from: index, to: index + 1 }));
    const remove = (): void => setQueue(q.removeTask(queue, index));
    const step: SimulationStep | undefined = { ok: true, energy: 100 };
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        key={index}
        className={classNames("flex items-center my-1", {
          "text-red-300": !step?.ok,
        })}
      >
        <div className="flex-grow">
          <TaskIcon className="inline align-sub" task={entry.task} /> x
          {entry.count}
        </div>
        <div className="px-4 text-yellow-300 font-bold">{step?.energy}</div>
        <Button size="sm" onClick={incrementCount}>
          <FaPlus />
        </Button>
        <Button size="sm" onClick={decrementCount}>
          <FaMinus />
        </Button>
        <Button size="sm" onClick={moveUp}>
          <FaArrowUp />
        </Button>
        <Button size="sm" onClick={moveDown}>
          <FaArrowDown />
        </Button>
        <Button size="sm" onClick={remove}>
          <RiDeleteBackFill />
        </Button>
      </div>
    );
  });

  const addButtons = useEngineSelector((engine) =>
    Object.values(TASKS).map((task) => ({
      kind: task.kind,
      cost: task.cost(engine),
      visible: task.visible(engine),
      canAddToQueue: canAddToQueue(engine, task),
      shortName: task.shortName,
    }))
  )
    .filter((task) => task.visible)
    .map((task) => {
      return (
        <Button
          className="font-mono whitespace-pre"
          key={task.kind}
          icon={ICONS[task.kind]}
          onClick={() => setQueue(q.pushTaskToQueue(queue, task.kind))}
          tooltip={<TaskTooltip kind={task.kind} />}
          state={task.canAddToQueue ? "active" : "locked"}
        >
          {task.shortName.padEnd(8)}
        </Button>
      );
    });
  // For reasons I don't understand, without the flex having an icon messes with
  // vertical alignment.
  return (
    <div className={classNames("flex flex-col", className)}>
      <div className="flex-auto overflow-y-scroll">{tasks}</div>
      <div>{addButtons}</div>
    </div>
  );
});
TaskQueueEditor.displayName = "TaskQueueEditor";

export default TaskQueueEditor;
