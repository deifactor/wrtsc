import { Button } from "./common/Button";
import { useEffect, useRef, useState } from "react";
import TaskQueueEditor from "./TaskQueueEditor";
import { ScheduleView } from "./ScheduleView";
import { StatView } from "./StatsView";
import { ZoneView } from "./ZoneView";
import { Engine } from "../engine";
import { PlayerView } from "./PlayerView";
import { configure } from "mobx";
import { observer } from "mobx-react-lite";

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

configure({
  observableRequiresReaction: true,
  reactionRequiresObservable: true,
});

const App = observer(() => {
  const [engine, setEngine] = useState(Engine.loadFromStorage);
  // XXX: not correct around leap seconds, tz changes, etc
  const [lastUpdate, setLastUpdate] = useState(new Date().getTime());

  useInterval(() => {
    const delta = new Date().getTime();
    const multiplier = isDev ? 1 : 1;
    const { ok } = engine.tickTime(multiplier * (delta - lastUpdate));
    setLastUpdate(delta);
    if (!ok || !engine.schedule.task) {
      engine.startLoop();
    }
    engine.saveToStorage();
  }, 1000 / UPDATES_PER_SEC);

  return (
    <div className="app flex space-x-10 p-4">
      <div className="w-96">
        <h1>Stats</h1>
        <PlayerView player={engine.player} />
        <Button kind="danger" onClick={() => setEngine(new Engine())}>
          Hard Reset
        </Button>
      </div>
      <TaskQueueEditor engine={engine} />
      <div className="w-96">
        <ScheduleView className="h-[36rem]" schedule={engine.schedule} />
        <Button onClick={() => engine.startLoop()}>Start</Button>
        <Button onClick={() => engine.nextTask()}>Next</Button>
      </div>
      <div>
        <ZoneView
          className="w-96 mb-12"
          zone={engine.zone}
          player={engine.player}
        />
      </div>
    </div>
  );
});

export default App;
