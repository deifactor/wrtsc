import { Button } from "./common/Button";
import { SimulationStep, TASKS } from "../engine";
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
  setBatchCountToMax,
} from "../engineStore";
import equal from "fast-deep-equal";
import { useAppDispatch, useAppSelector, useEngineSelector } from "../store";

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
    const setToMaxButton = TASKS[entry.task].maxIterations && (
      <Button size="xs" onClick={() => dispatch(setBatchCountToMax(index))}>
        Max
      </Button>
    );
    const step: SimulationStep | undefined = simulation[index];
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        key={index}
        className={classNames("flex items-center leading-8 my-1", {
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

  const addButtons = useEngineSelector((engine) => Object.values(engine.tasks))
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
