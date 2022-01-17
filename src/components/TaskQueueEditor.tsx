import { Button } from "./common/Button";
import { observer } from "mobx-react-lite";
import { TaskKind, TASKS } from "../task";
import { StatId, STAT_NAME } from "../player";
import { Engine, SimulationStep } from "../engine";
import classNames from "classnames";
import { runInAction } from "mobx";
import { IconType } from "react-icons";
import {
  GiBatteryPack,
  GiJourney,
  GiLaserBlast,
  GiLockPicking,
  GiSpaceship,
  GiSpyglass,
  GiTargeting,
} from "react-icons/gi";
const ICONS: Partial<Record<TaskKind, IconType>> = {
  exploreRuins: GiTargeting,
  scavengeBatteries: GiBatteryPack,
  scavengeWeapons: GiLaserBlast,
  observePatrolRoutes: GiSpyglass,
  hijackShip: GiSpaceship,
  disableLockouts: GiLockPicking,
  leaveRuins: GiJourney,
};

interface Props {
  engine: Engine;
}

const TaskQueueEditor = observer((props: Props) => {
  const {
    engine: { nextLoopTasks, player, simulation },
  } = props;
  const tasks = nextLoopTasks.entries.map((entry, idx) => {
    const incrementCount = (): void => nextLoopTasks.modifyCount(idx, 1);
    const decrementCount = (): void => nextLoopTasks.modifyCount(idx, -1);
    const step: SimulationStep | undefined = simulation[idx];
    return (
      // eslint-disable-next-line react/no-array-index-key
      <div
        key={idx}
        className={classNames("flex items-center", {
          "text-red-300": !step?.ok,
        })}
      >
        <div className="flex-grow">
          {entry.task.name} x{entry.count}
        </div>
        <div className="px-4 text-yellow-300 font-bold">{step?.energy}</div>
        <Button size="sm" onClick={incrementCount}>
          +1
        </Button>
        <Button size="sm" onClick={decrementCount}>
          -1
        </Button>
      </div>
    );
  });

  const addButtons = Object.values(TASKS)
    .filter((task) => task.visible(player))
    .map((task) => {
      const requirements = Object.entries(task.requiredStats).map(
        ([id, min]) => (
          <span key={id}>
            {STAT_NAME[id as StatId]} {min}
          </span>
        )
      );
      const tooltip = (
        <div className="w-96 p-2 text-sm">
          <p className="mb-2">{task.description}</p>
          <p>
            <strong>Cost:</strong> {player.cost(task)}
          </p>
          {Object.keys(task.requiredStats).length !== 0 && (
            <p>
              <strong>Requires: </strong>
              {requirements}
            </p>
          )}
          <hr className="border-gray-700 my-3" />
          <p className="text-xs mb-2 text-gray-400">{task.flavor}</p>
        </div>
      );
      return (
        <Button
          key={task.kind}
          icon={ICONS[task.kind]}
          onClick={() => runInAction(() => nextLoopTasks.push(task.kind))}
          tooltip={tooltip}
          state={player.canAddToQueue(task) ? "active" : "locked"}
        >
          {task.name}
        </Button>
      );
    });
  // For reasons I don't understand, without the flex having an icon messes with
  // vertical alignment.
  return (
    <div>
      <div className="h-[36rem]">
        <h1>Queue</h1>
        {tasks}
      </div>
      <div className="flex flex-wrap">{addButtons}</div>
    </div>
  );
});

export default TaskQueueEditor;
