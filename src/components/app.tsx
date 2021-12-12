import { Button, ButtonGroup } from '@chakra-ui/react';
import { FunctionalComponent, h } from 'preact';
import { useState } from 'preact/hooks';
import { TaskQueue } from '../taskQueue';
import TaskQueueEditor from './taskQueueEditor';
import { Schedule } from '../schedule';
import { ScheduleView } from './scheduleView';
import style from './global.scss';

const App: FunctionalComponent = () => {
  const [taskQueue] = useState(() => new TaskQueue());
  const [schedule, setSchedule] = useState(() => new Schedule(taskQueue.clone()));
  const onStart = (): void => {
    setSchedule(new Schedule(taskQueue.clone()));
  };
  const onNext = (): void => {
    schedule.next();
  };

  return (
    <div class={style.app}>
      <TaskQueueEditor taskQueue={taskQueue} />
      <ScheduleView schedule={schedule} />
      <Button size='md'>Start</Button>
      <button type="button" onClick={onStart}>Start</button>
      <button type="button" onClick={onNext}>Next</button>
    </div>
  );
};

export default App;
