import { Button } from "./common/Button";
import { useState } from "react";
import { TaskQueue } from "../taskQueue";
import TaskQueueEditor from "./TaskQueueEditor";
import { Schedule } from "../schedule";
import { ScheduleView } from "./ScheduleView";
import { Stats } from "../stats";
import { StatsView } from "./StatsView";

const App = () => {
  const [taskQueue] = useState(() => new TaskQueue());
  const [stats] = useState(() => new Stats());
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
      <div className="flex space-x-10">
        <TaskQueueEditor taskQueue={taskQueue} />
        <ScheduleView schedule={schedule} />
      </div>
      <Button onClick={onStart}>Start</Button>
      <Button onClick={onNext}>Next</Button>
      <StatsView stats={stats} />
    </div>
  );
};

export default App;
