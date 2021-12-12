import { useState } from 'react';
import { TaskQueue } from '../taskQueue';
import TaskQueueEditor from './TaskQueueEditor';
import { Schedule } from '../schedule';
import { ScheduleView } from './ScheduleView';
import './global.css';

const App = () => {
  const [taskQueue] = useState(() => new TaskQueue());
  const [schedule, setSchedule] = useState(() => new Schedule(taskQueue.clone()));
  const onStart = (): void => {
    setSchedule(new Schedule(taskQueue.clone()));
  };
  const onNext = (): void => {
    schedule.next();
  };

  return (
    <div className='app'>
      <div className='flex'>
        <TaskQueueEditor taskQueue={taskQueue} />
        <ScheduleView schedule={schedule} />
      </div>
      <button onClick={onStart}>Start</button>
      <button onClick={onNext}>Next</button>
    </div>
  );
};

export default App;
