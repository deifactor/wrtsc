import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import TaskQueueEditor from "./TaskQueueEditor";
import { ScheduleDisplay } from "./ScheduleDisplay";
import { ZonePane } from "./ZonePane";
import { PlayerPane } from "./PlayerPane";
import classNames from "classnames";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { SettingsPanel } from "./SettingsPanel";
import { AboutPanel } from "./AboutPanel";
import { Intro } from "./Intro";
import { tick } from "../worldStore";
import { useAppDispatch, useAppSelector } from "../store";
import { hasSave, loadAction, saveAction } from "../save";
import { SimulantPanel } from "./SimulantPanel";
import { HelpPanel } from "./HelpPanel";

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

const UPDATES_PER_SEC = 50;

type PanelProps = {
  children: ReactNode;
  className: string;
};

const Pane = ({ children, className }: PanelProps) => {
  const panelClass =
    "p-4 bg-black/70 border-gray-500 border backdrop-blur-[6px]";

  return <div className={classNames(panelClass, className)}>{children}</div>;
};

/**
 * Top-level element for the entire game.
 *
 * Minimize the amount of state you throw around here, since it'll cause
 * everything to rerender!
 */
const App = () => {
  const dispatch = useAppDispatch();
  const [inIntro, setInIntro] = useState(!hasSave());

  useInterval(() => {
    if (inIntro) {
      return;
    }
    dispatch(tick());
  }, 1000 / UPDATES_PER_SEC);

  useEffect(() => dispatch(loadAction()), [dispatch]);

  useInterval(() => {
    dispatch(saveAction());
  }, 1000);

  const simulantUnlocked = useAppSelector(
    (store) => "simulantUnlocked" in store.world.engine.milestones
  );

  const introFinished = useCallback(() => setInIntro(false), []);
  if (inIntro) {
    return <Intro onFinished={introFinished} />;
  }

  // The overflow-auto on the tabs is necessary for some CSS reason I don't
  // understand. See
  // https://stackoverflow.com/questions/21515042/scrolling-a-flexbox-with-overflowing-content
  return (
    <div className="app flex space-x-6 p-4 items-start h-full max-w-screen-2xl mx-auto">
      <Pane className="w-3/12">
        <PlayerPane />
      </Pane>

      <Pane className="w-8/12 h-full">
        <Tabs
          className="flex flex-col h-full"
          selectedTabPanelClassName="flex-auto overflow-auto"
          selectedTabClassName="text-white font-bold"
        >
          <TabList className="flex flex-row text-xl justify-evenly text-gray-400">
            <Tab>Queue</Tab>
            {simulantUnlocked && <Tab>Simulant</Tab>}
            <Tab>Settings</Tab>
            <Tab>Help</Tab>
            <Tab>About</Tab>
          </TabList>
          <hr className="border-gray-400 my-4" />
          <TabPanel>
            <div className="flex flex-row h-full space-x-8">
              <TaskQueueEditor className="h-full w-3/5" />
              <div className="w-px bg-gray-800" />
              <ScheduleDisplay className="h-full w-2/5" />
            </div>
          </TabPanel>
          {simulantUnlocked && (
            <TabPanel>
              <SimulantPanel />
            </TabPanel>
          )}
          <TabPanel>
            <SettingsPanel />
          </TabPanel>
          <TabPanel>
            <HelpPanel />
          </TabPanel>
          <TabPanel>
            <AboutPanel />
          </TabPanel>
        </Tabs>
      </Pane>

      <Pane className="w-3/12">
        <ZonePane className="mb-12" />
      </Pane>
    </div>
  );
};

export default App;
