import { Button } from "./common/Button";
import { TASKS } from "../engine";
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
  setBatchCount,
} from "../nextQueueStore";
import equal from "fast-deep-equal";
import { useAppDispatch, useAppSelector } from "../store";
import { ConnectableElement, useDrag, useDrop } from "react-dnd";
import { SimulationStep } from "../engine/predict";
import { selectVisibleTasks, useEngineSelector } from "../worldStore";

const DRAG_TYPE = "TASK_BATCH";

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

const TaskQueueItem = React.memo(
  ({ index, showHp }: { index: number; showHp: boolean }) => {
    const dispatch = useAppDispatch();

    const [{ isDragging }, dragRef] = useDrag(() => ({
      type: DRAG_TYPE,
      item: { from: index },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }));
    const [{ isOver }, dropRef] = useDrop(() => ({
      accept: DRAG_TYPE,
      drop: (item: { from: number }) => {
        if (item.from !== index) {
          dispatch(moveTask({ from: item.from, to: index }));
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }));

    const mergedRef = (instance: ConnectableElement) => {
      dragRef(instance);
      dropRef(instance);
    };

    const entry = useAppSelector(
      (store) => store.nextQueue.queue[index],
      equal
    );
    const maxIterations = useEngineSelector((engine) => {
      const { maxIterations } = TASKS[entry.task];
      return maxIterations && maxIterations(engine);
    });
    const step: SimulationStep | undefined = useAppSelector(
      (store) => store.nextQueue.simulation[index],
      equal
    );
    const incrementCount = () =>
      dispatch(modifyBatchCount({ index, amount: 1 }));
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
        onClick={() =>
          maxIterations !== undefined &&
          dispatch(setBatchCount({ index, amount: maxIterations }))
        }
      >
        <FiMaximize />
      </Button>
    );
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        ref={mergedRef}
        key={index}
        className={classNames(
          "flex items-center h-10",
          {
            "text-red-300": !step?.ok,
          },
          { "opacity-50": isDragging },
          { "bg-gray-500": isOver }
        )}
      >
        <div className="flex-grow font-mono text-lg">
          <TaskIcon className="inline" task={entry.task} /> x{entry.count}
        </div>
        <div
          className={classNames(
            "px-2 text-green-300 font-mono font-bold text-lg w-16 text-right",
            { invisible: !showHp }
          )}
        >
          {step?.hp.toFixed(0)}
        </div>
        <div className="px-2 text-yellow-300 font-mono font-bold text-lg w-16 text-right">
          {step?.energy.toFixed(0)}
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
  }
);
TaskQueueItem.displayName = "TaskQueueItem";

const TaskQueueEditor = React.memo((props: { className?: string }) => {
  const { className } = props;
  const length = useAppSelector((store) => store.nextQueue.queue.length);
  const indices = Array.from(Array(length).keys());

  const visibleTasks = useAppSelector(selectVisibleTasks);
  const addButtons = visibleTasks.map((id) => (
    <AddTaskButton key={id} id={id} />
  ));
  // Don't bother showing HP values if there's no combat involved.
  const showHp = useAppSelector((store) =>
    store.nextQueue.queue.some((batch) => TASKS[batch.task].kind === "combat")
  );
  // For reasons I don't understand, without the flex having an icon messes with
  // vertical alignment.
  return (
    <div className={classNames("flex flex-col", className)}>
      <div className="flex-auto overflow-y-scroll">
        {indices.map((index) => (
          <TaskQueueItem key={index} index={index} showHp={showHp} />
        ))}
      </div>
      <div>{addButtons}</div>
    </div>
  );
});
TaskQueueEditor.displayName = "TaskQueueEditor";

export default TaskQueueEditor;
