import { Button } from './common/Button';
import { observer } from 'mobx-react-lite';
import { TaskQueue } from '../taskQueue';
import { ALL_TASKS } from '../task';

interface Props {
  taskQueue: TaskQueue
}

const TaskQueueEditor = observer((props: Props) => {
  const { taskQueue } = props;
  const tasks = taskQueue.entries.map((entry, idx) => {
    const incrementCount = (): void => taskQueue.modifyCount(idx, 1);
    const decrementCount = (): void => taskQueue.modifyCount(idx, -1);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={idx}>
        {entry.task.name} x{entry.count}
        <Button onClick={incrementCount}>+1</Button>
        <Button onClick={decrementCount}>-1</Button>
      </div>
    );
  });

  const addButtons = ALL_TASKS.map((task) => {
    const tooltipId = `task-tooltip-${task.kind}`;
    return <Button key={task.kind} onClick={() => taskQueue.push(task)}>{task.name}</Button>
  });
  return (
    <div>
      {tasks}
      {addButtons}
    </div>
  );
});

export default TaskQueueEditor;
