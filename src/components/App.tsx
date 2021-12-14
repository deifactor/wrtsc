import { Button } from "./common/Button";
import { useState } from "react";
import { TaskQueue } from "../taskQueue";
import TaskQueueEditor from "./TaskQueueEditor";
import { Schedule } from "../schedule";
import { ScheduleView } from "./ScheduleView";
import { StatsView } from "./StatsView";
import { ZoneView } from "./ZoneView";
import { Player } from "../player";
import { RUINS } from "../zone";

const App = () => {
  const [taskQueue] = useState(() => new TaskQueue());
  const [player] = useState(() => new Player());
  const [zone] = useState(() => RUINS);
  const [schedule, setSchedule] = useState(
    () => new Schedule(taskQueue.clone())
  );
  const onStart = (): void => {
    setSchedule(new Schedule(taskQueue.clone()));
  };
  const onNext = (): void => {
    schedule.task?.perform(player);
    schedule.next();
  };

  return (
    <div className="app flex space-x-10 p-4">
      <StatsView className="w-96" stats={player.stats} />
      <TaskQueueEditor taskQueue={taskQueue} />
      <div>
        <ScheduleView className="h-[36rem]" schedule={schedule} />
        <Button onClick={onStart}>Start</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
      <div className="flex-grow"></div>
      <ZoneView className="w-96" zone={zone} />
    </div>
  );
};

export default App;
