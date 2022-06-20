import { Button } from "./common/Button";
import { observer } from "mobx-react-lite";
import { TASKS } from "../task";
import { SKILL_NAME, StatId, STAT_NAME } from "../player";
import { Engine, SimulationStep } from "../engine";
import classNames from "classnames";
import { runInAction } from "mobx";
import { ICONS, TaskIcon } from "./common/TaskIcon";
import { FaArrowDown, FaArrowUp, FaMinus, FaPlus } from "react-icons/fa";
import { RiDeleteBackFill } from "react-icons/ri";

interface Props {
  className?: string;
  engine: Engine;
}

const TaskQueueEditor = observer((props: Props) => {
  const {
    engine: { nextLoopTasks, player, simulation },
    className,
  } = props;
  const tasks = nextLoopTasks.entries.map((entry, idx) => {
    const incrementCount = (): void => nextLoopTasks.modifyCount(idx, 1);
    const decrementCount = (): void => nextLoopTasks.modifyCount(idx, -1);
    const moveUp = (): void => nextLoopTasks.move(idx, idx - 1);
    const moveDown = (): void => nextLoopTasks.move(idx, idx + 1);
    const remove = (): void => nextLoopTasks.remove(idx);
    const step: SimulationStep | undefined = simulation[idx];
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        key={idx}
        className={classNames("flex items-center my-1", {
          "text-red-300": !step?.ok,
        })}
      >
        <div className="flex-grow">
          <TaskIcon className="inline align-sub" task={entry.task.kind} /> x
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
    .filter((task) => task.visible(player))
    .map((task) => {
      const requirements = Object.entries(task.requiredStats).map(
        ([id, min]) => (
          <span key={id}>
            {STAT_NAME[id as StatId]} {min}
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
            <strong>Cost:</strong> {player.cost(task)}
          </p>
          {Object.keys(task.requiredStats).length !== 0 && (
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
          onClick={() => runInAction(() => nextLoopTasks.push(task.kind))}
          tooltip={tooltip}
          state={player.canAddToQueue(task) ? "active" : "locked"}
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
