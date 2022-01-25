import { Button } from "./common/Button";
import { ReactNode, useEffect, useRef, useState } from "react";
import TaskQueueEditor from "./TaskQueueEditor";
import { ScheduleView } from "./ScheduleView";
import { ZoneView } from "./ZoneView";
import { Engine } from "../engine";
import { PlayerView } from "./PlayerView";
import { configure, runInAction } from "mobx";
import { observer } from "mobx-react-lite";
import classNames from "classnames";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { Settings, SettingsView } from "./SettingsView";
import { Credits } from "./Credits";

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


type PanelProps = {
  children: ReactNode;
  className: string
}

const Panel = ({ children, className }: PanelProps) => {
  const panelClass =
    "p-4 bg-black/70 border-gray-500 border backdrop-blur-[6px]";

  return <div className={classNames(panelClass, className)}>
    {children}
  </div>;
};

const App = observer(() => {
  const [engine, setEngine] = useState(Engine.loadFromStorage);
  const [settings] = useState(new Settings());
  // XXX: not correct around leap seconds, tz changes, etc
  const [lastUpdate, setLastUpdate] = useState(new Date().getTime());

  useInterval(() => {
    runInAction(() => {
      const delta = new Date().getTime();
      const multiplier = isDev ? 1 : 1;
      const { ok } = engine.tickTime(multiplier * (delta - lastUpdate));
      setLastUpdate(delta);
      if (settings.autoRestart && (!ok || !engine.schedule.task)) {
        engine.startLoop();
      }
      engine.saveToStorage();
    });
  }, 1000 / UPDATES_PER_SEC);

  // The overflow-auto on the tabs is necessary for some CSS reason I don't
  // understand. See
  // https://stackoverflow.com/questions/21515042/scrolling-a-flexbox-with-overflowing-content

  return (
    <div className="app flex space-x-10 p-4 items-start h-full">

      <Panel className="w-3/12">
        <h1>Stats</h1>
        <PlayerView player={engine.player} />
        <Button onClick={() => engine.startLoop()}>Start</Button>
        <Button onClick={() => engine.nextTask()}>Next</Button>
      </Panel>

      <Panel className="w-8/12 h-full">
        <Tabs className="flex flex-col h-full" selectedTabPanelClassName="flex-auto overflow-auto"
          selectedTabClassName="text-white font-bold">
          <TabList className="flex flex-row text-xl justify-evenly text-gray-400">
            <Tab>Queue</Tab>
            <Tab>Settings</Tab>
            <Tab>Credits</Tab>
          </TabList>
          <hr className="border-gray-400 my-4" />
          <TabPanel>
            <div className="flex flex-row h-full space-x-12">
              <TaskQueueEditor className="h-full w-3/5" engine={engine} />
              <ScheduleView
                className="h-full w-2/5"
                schedule={engine.schedule}
                player={engine.player}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <SettingsView onHardReset={() => setEngine(new Engine())}
              settings={settings} />
          </TabPanel>
          <TabPanel>
            <Credits />
          </TabPanel>
        </Tabs>
      </Panel>

      <Panel className="w-3/12">
        <h1>Location</h1>
        <ZoneView className="mb-12" zone={engine.zone} player={engine.player} />
      </Panel>

    </div>
  );
});

export default App;
