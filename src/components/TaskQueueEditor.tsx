import { observer } from 'mobx-react-lite';
import { TaskQueue } from '../taskQueue';
import { ALL_TASKS } from '../task';
import ReactTooltip from 'react-tooltip';

interface Props {
  taskQueue: TaskQueue
}

const TaskQueueEditor =  observer((props: Props) => {
  const { taskQueue } = props;
  const tasks = taskQueue.entries.map((entry, idx) => {
    const incrementCount = (): void => taskQueue.modifyCount(idx, 1);
    const decrementCount = (): void => taskQueue.modifyCount(idx, -1);
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div key={idx}>
        {entry.task.name} x{entry.count}
        <button type="button" onClick={incrementCount}>+1</button>
        <button type="button" onClick={decrementCount}>-1</button>
      </div>
    );
  });

  const addButtons = ALL_TASKS.map((task) => {
    const tooltipId = `task-tooltip-${task.kind}`;
    return <>
      <button
        key={task.kind}
        data-for={tooltipId}
        data-tip=''
        type="button"
        onClick={() => taskQueue.push(task)}>
        {task.name}
      </button>
      <ReactTooltip id={tooltipId} place="right">
        <p>{task.description}</p>
        <p><strong>Cost</strong>: {task.baseCost}</p>
      </ReactTooltip>
    </>
  });
  return (
    <div>
      {tasks}
      {addButtons}
    </div>
  );
});

export default TaskQueueEditor;
