import { Button } from "./common/Button";
import { observer } from "mobx-react-lite";
import { TaskQueue } from "../taskQueue";
import { ALL_TASKS } from "../task";
import { Player } from "../player";
import { Engine, SimulationResult } from "../engine";
import classNames from "classnames";

interface Props {
  engine: Engine;
}

const TaskQueueEditor = observer((props: Props) => {
  const {
    engine: { taskQueue, player, simulation },
  } = props;
  const tasks = taskQueue.entries.map((entry, idx) => {
    const incrementCount = (): void => taskQueue.modifyCount(idx, 1);
    const decrementCount = (): void => taskQueue.modifyCount(idx, -1);
    const isFailure =
      simulation.kind == "error" && simulation.step == entry.task;
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        key={idx}
        className={classNames("flex items-center", {
          "text-red-300": isFailure,
        })}
      >
        <div className="flex-grow">
          {entry.task.name} x{entry.count}
        </div>
        <Button size="sm" onClick={incrementCount}>
          +1
        </Button>
        <Button size="sm" onClick={decrementCount}>
          -1
        </Button>
      </div>
    );
  });

  const addButtons = ALL_TASKS.map((task) => {
    const tooltip = (
      <div>
        <p>{task.description}</p>
        <p>
          <strong>Cost:</strong> {task.baseCost}
        </p>
      </div>
    );
    return (
      <Button
        key={task.kind}
        onClick={() => taskQueue.push(task)}
        tooltip={tooltip}
        state={task.unlocked(player) ? "active" : "locked"}
      >
        {task.name}
      </Button>
    );
  });
  return (
    <div>
      <div className="h-[36rem]">
        <h1>Queue</h1>
        {tasks}
      </div>
      {addButtons}
    </div>
  );
});

export default TaskQueueEditor;
