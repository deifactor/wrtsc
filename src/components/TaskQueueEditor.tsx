import { Button } from "./common/Button";
import { Engine, SimulationStep, Task, TASKS } from "../engine";
import classNames from "classnames";
import { ICONS, TaskIcon } from "./common/TaskIcon";
import { FaArrowDown, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import { RiDeleteBackFill } from "react-icons/ri";
import React from "react";
import { TaskTooltip } from "./TaskTooltip";
import {
  modifyBatchCount,
  moveTask,
  pushTaskToQueue,
  removeTask,
  useAppDispatch,
  useAppSelector,
  useEngineSelector,
} from "../engineStore";
import { entries } from "../records";
import equal from "fast-deep-equal";

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
}

const TaskQueueEditor = React.memo((props: Props) => {
  const dispatch = useAppDispatch();
  const queue = useAppSelector((store) => store.engine.nextQueue);
  const simulation = useAppSelector((store) => store.engine.simulation, equal);
  const { className } = props;
  const tasks = queue.map((entry, index) => {
    const incrementCount = () =>
      dispatch(modifyBatchCount({ index, amount: 1 }));
    const decrementCount = () =>
      dispatch(modifyBatchCount({ index, amount: -1 }));
    const moveUp = () => dispatch(moveTask({ from: index, to: index - 1 }));
    const moveDown = () => dispatch(moveTask({ from: index, to: index + 1 }));
    const remove = () => dispatch(removeTask(index));
    const step: SimulationStep | undefined = simulation[index];
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
          onClick={() => dispatch(pushTaskToQueue(task.kind))}
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
