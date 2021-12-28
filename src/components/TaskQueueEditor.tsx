import { Button } from "./common/Button";
import { observer } from "mobx-react-lite";
import { TaskQueue } from "../taskQueue";
import { ALL_TASKS } from "../task";
import { Player } from "../player";

interface Props {
  taskQueue: TaskQueue;
  // Necessary so that we can figure out what tasks are enabled.
  player: Player;
}

const TaskQueueEditor = observer((props: Props) => {
  const { taskQueue, player } = props;
  const tasks = taskQueue.entries.map((entry, idx) => {
    const incrementCount = (): void => taskQueue.modifyCount(idx, 1);
    const decrementCount = (): void => taskQueue.modifyCount(idx, -1);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={idx} className="flex items-center">
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
