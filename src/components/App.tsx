import { Button } from "./common/Button";
import { useState } from "react";
import { TaskQueue } from "../taskQueue";
import TaskQueueEditor from "./TaskQueueEditor";
import { Schedule } from "../schedule";
import { ScheduleView } from "./ScheduleView";
import "./global.css";

const App = () => {
  const [taskQueue] = useState(() => new TaskQueue());
  const [schedule, setSchedule] = useState(
    () => new Schedule(taskQueue.clone())
  );
  const onStart = (): void => {
    setSchedule(new Schedule(taskQueue.clone()));
  };
  const onNext = (): void => {
    schedule.next();
  };

  return (
    <div className="app">
      <div className="flex">
        <TaskQueueEditor taskQueue={taskQueue} />
        <ScheduleView schedule={schedule} />
      </div>
      <Button onClick={onStart}>Start</Button>
      <Button onClick={onNext}>Next</Button>
    </div>
  );
};

export default App;
