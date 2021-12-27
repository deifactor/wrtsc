import { Button } from "./common/Button";
import { useEffect, useRef, useState } from "react";
import { TaskQueue } from "../taskQueue";
import TaskQueueEditor from "./TaskQueueEditor";
import { Schedule } from "../schedule";
import { ScheduleView } from "./ScheduleView";
import { StatsView } from "./StatsView";
import { ZoneView } from "./ZoneView";
import { Player } from "../player";
import { RUINS } from "../zone";

/**
 * Set up a callback to be called at intervals of `delay`. Setting it to `null`
 * pauses the callback.
 */
function useInterval(callback: () => void, delay: number) {
  // Implementation from https://overreacted.io/making-setinterval-declarative-with-react-hooks/
  const savedCallback = useRef<() => void>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    const tick = () => savedCallback.current!();
    if (delay !== null) {
      const id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

const isDev = process.env.NODE_ENV === "development";
const UPDATES_PER_SEC = 12;

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
  // XXX: not correct around leap seconds, tz changes, etc
  const [lastUpdate, setLastUpdate] = useState(new Date().getTime());

  useInterval(() => {
    const delta = new Date().getTime();
    const multiplier = isDev ? 5 : 1;
    schedule.tickTime((multiplier * (delta - lastUpdate)) / 1000);
    setLastUpdate(delta);

    if (schedule.taskDone) {
      schedule.task?.perform(player);
      schedule.next();
    }
  }, 1000 / UPDATES_PER_SEC);

  return (
    <div className="app flex space-x-10 p-4">
      <StatsView className="w-96" stats={player.stats} />
      <TaskQueueEditor taskQueue={taskQueue} />
      <div className="flex-grow">
        <ScheduleView className="h-[36rem]" schedule={schedule} />
        <Button onClick={onStart}>Start</Button>
        <Button onClick={onNext}>Next</Button>
      </div>
      <ZoneView className="w-96" zone={zone} />
    </div>
  );
};

export default App;
