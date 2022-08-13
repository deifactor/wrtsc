import { Button } from "./common/Button";
import {
  SimulationStep,
  TASKS,
  SKILL_NAME,
  ProgressId,
  PROGRESS_NAME,
} from "../engine";
import classNames from "classnames";
import { ICONS, TaskIcon } from "./common/TaskIcon";
import { FaArrowDown, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import { RiDeleteBackFill } from "react-icons/ri";
import * as q from "../engine/taskQueue";

interface Props {
  className?: string;
  queue: q.TaskQueue;
  setQueue: (queue: q.TaskQueue) => void;
}

const TaskQueueEditor = (props: Props) => {
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

  const addButtons = Object.values(TASKS)
    .filter((task) => true)
    .map((task) => {
      const requirements = Object.entries(task.requiredProgress).map(
        ([id, min]) => (
          <span key={id}>
            {PROGRESS_NAME[id as ProgressId]} {min}
          </span>
        )
      );
      const trainingSection = task.trainedSkills.length !== 0 && (
        <p>
          <strong>Trains:</strong>{" "}
          {task.trainedSkills.map((s) => SKILL_NAME[s]).join(", ")}
        </p>
      );
      const tooltip = (
        <div className="w-96 p-2 text-sm">
          <p className="font-bold">{task.name}</p>
          <p className="my-2">{task.description}</p>
          <p>
            <strong>Cost:</strong> OOPS
          </p>
          {Object.keys(task.requiredProgress).length !== 0 && (
            <p>
              <strong>Requires: </strong>
              {requirements}
            </p>
          )}
          {trainingSection}
          <hr className="border-gray-700 my-3" />
          <p className="text-xs mb-2 text-gray-400">{task.flavor}</p>
        </div>
      );
      return (
        <Button
          className="font-mono whitespace-pre"
          key={task.kind}
          icon={ICONS[task.kind]}
          onClick={() => setQueue(q.pushTaskToQueue(queue, task.kind))}
          tooltip={tooltip}
          state={true ? "active" : "locked"}
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
};
TaskQueueEditor.displayName = "TaskQueueEditor";

export default TaskQueueEditor;
