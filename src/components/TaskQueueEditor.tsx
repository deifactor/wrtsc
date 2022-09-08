import { Button } from "./common/Button";
import { SimulationStep, TASKS } from "../engine";
import { TaskId } from "../engine";
import classNames from "classnames";
import { ICONS, TaskIcon } from "./common/TaskIcon";
import { FaArrowDown, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import { FiMaximize } from "react-icons/fi";
import { RiDeleteBackFill } from "react-icons/ri";
import React from "react";
import { TaskTooltip } from "./TaskTooltip";
import {
  modifyBatchCount,
  moveTask,
  pushTaskToQueue,
  removeTask,
  setBatchCountToMax,
} from "../worldStore";
import equal from "fast-deep-equal";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";

const AddTaskButton = React.memo(({ id }: { id: TaskId }) => {
  const dispatch = useAppDispatch();
  const canAddToQueue = useAppSelector(
    (store) => store.world.view.tasks[id].canAddToQueue
  );
  return (
    <Button
      className="font-mono whitespace-pre"
      key={id}
      icon={ICONS[id]}
      onClick={() => dispatch(pushTaskToQueue(id))}
      tooltip={<TaskTooltip id={id} />}
      state={canAddToQueue ? "active" : "locked"}
    >
      {TASKS[id].shortName.padEnd(8)}
    </Button>
  );
});

const TaskQueueItem = React.memo(({ index }: { index: number }) => {
  const dispatch = useAppDispatch();
  const entry = useAppSelector((store) => store.world.nextQueue[index], equal);
  const step: SimulationStep | undefined = useAppSelector(
    (store) => store.world.simulation[index],
    equal
  );
  const incrementCount = () => dispatch(modifyBatchCount({ index, amount: 1 }));
  const decrementCount = () =>
    dispatch(modifyBatchCount({ index, amount: -1 }));
  const moveUp = () => dispatch(moveTask({ from: index, to: index - 1 }));
  const moveDown = () => dispatch(moveTask({ from: index, to: index + 1 }));
  const remove = () => dispatch(removeTask(index));
  const maxClass = classNames({
    invisible: !TASKS[entry.task].maxIterations,
  });
  // We always show the button for consistent sizing.
  const setToMaxButton = (
    <Button
      className={maxClass}
      size="xs"
      onClick={() => dispatch(setBatchCountToMax(index))}
    >
      <FiMaximize />
    </Button>
  );
  return (
    // eslint-disable-next-line react/no-array-index-key
    <div
      key={index}
      className={classNames("flex items-center h-10", {
        "text-red-300": !step?.ok,
      })}
    >
      <div className="flex-grow font-mono text-lg">
        <TaskIcon className="inline" task={entry.task} /> x{entry.count}
      </div>
      <div className="px-4 text-yellow-300 font-mono font-bold text-lg">
        {step?.energy}
      </div>
      <div className="text-sm">
        {setToMaxButton}
        <Button size="xs" onClick={incrementCount}>
          <FaPlus size="1em" />
        </Button>
        <Button size="xs" onClick={decrementCount}>
          <FaMinus />
        </Button>
        <Button size="xs" onClick={moveUp}>
          <FaArrowUp />
        </Button>
        <Button size="xs" onClick={moveDown}>
          <FaArrowDown />
        </Button>
        <Button size="xs" onClick={remove}>
          <RiDeleteBackFill />
        </Button>
      </div>
    </div>
  );
});

const TaskQueueEditor = React.memo((props: { className?: string }) => {
  const { className } = props;
  const length = useAppSelector((store) => store.world.nextQueue.length);
  const indices = Array.from(Array(length).keys());

  const visibleTasks = useEngineSelector((engine) =>
    Object.values(engine.tasks)
      .filter((task) => task.visible)
      .map((task) => task.id)
  );
  const addButtons = visibleTasks.map((id) => (
    <AddTaskButton key={id} id={id} />
  ));
  // For reasons I don't understand, without the flex having an icon messes with
  // vertical alignment.
  return (
    <div className={classNames("flex flex-col", className)}>
      <div className="flex-auto overflow-y-scroll">
        {indices.map((index) => (
          <TaskQueueItem key={index} index={index} />
        ))}
      </div>
      <div>{addButtons}</div>
    </div>
  );
});
TaskQueueEditor.displayName = "TaskQueueEditor";

export default TaskQueueEditor;
