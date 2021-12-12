import { useState } from 'react';
import { TaskQueue } from '../taskQueue';
import TaskQueueEditor from './taskQueueEditor';
import { Schedule } from '../schedule';
import { ScheduleView } from './scheduleView';
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
      <TaskQueueEditor taskQueue={taskQueue} />
      <ScheduleView schedule={schedule} />
      <button type="button" onClick={onStart}>Start</button>
      <button type="button" onClick={onNext}>Next</button>
    </div>
  );
};

export default App;
