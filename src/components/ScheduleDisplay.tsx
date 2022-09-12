import classNames from "classnames";
import { TaskIcon } from "./common/TaskIcon";
import { useAppSelector } from "../store";
import equal from "fast-deep-equal";
import { useEngineSelector } from "../worldStore";

interface Props {
  className?: string;
}

function formatCompletion(frac: number): string {
  const percent = (frac * 100).toFixed(0).padStart(3, " ");
  return `[${percent}%]`;
}

export const ScheduleDisplay = (props: Props) => {
  const { className } = props;
  const schedule = useAppSelector((store) => store.world.schedule, equal);
  const taskState = useEngineSelector(({ taskState }) => {
    if (!taskState) {
      return undefined;
    }
    switch (taskState.kind) {
      case "normal":
        return {
          progress: taskState.energyTotal - taskState.energyLeft,
          cost: taskState.energyTotal,
        };
      case "combat":
        return {
          progress: taskState.hpTotal - taskState.hpLeft,
          cost: taskState.hpTotal,
        };
    }
  });

  const entries = schedule.queue.map((entry, idx) => {
    const { success, failure } = schedule.completions[idx];
    let progressInner;
    if (schedule.completions[idx].failure) {
      progressInner = <span className="text-red-400">[FAIL]</span>;
    } else if (schedule.index === undefined) {
      progressInner = <span>[{"    "}]</span>;
    } else if (idx < schedule.index) {
      progressInner = (
        <span>
          <span className="text-green-400">[ OK ]</span>
        </span>
      );
    } else if (idx === schedule.index) {
      const completionFraction = taskState!.progress / taskState!.cost;
      progressInner = formatCompletion(completionFraction);
    } else {
      progressInner = <span>[{"    "}]</span>;
    }

    // We need whitespace-pre here because we pad with spaces.
    // eslint-disable-next-line react/no-array-index-key
    return (
      <div className="flex items-center font-mono h-10" key={idx}>
        <span className="inline-block">
          <TaskIcon className="inline" task={entry.task} /> {success + failure}/
          {entry.count}{" "}
        </span>
        <span className="inline-block ml-auto whitespace-pre font-bold">
          {progressInner}
        </span>
      </div>
    );
  });
  return (
    <div className={classNames("flex flex-col h-full", className)}>
      {entries}
    </div>
  );
};
ScheduleDisplay.displayName = "ScheduleDisplay";
