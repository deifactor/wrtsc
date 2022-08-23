import classNames from "classnames";
import { TaskIcon } from "./common/TaskIcon";
import { useEngineSelector } from "../store";

interface Props {
  className?: string;
}

function formatCompletion(frac: number): string {
  const percent = (frac * 100).toFixed(0).padStart(3, " ");
  return `[${percent}%]`;
}

export const ScheduleDisplay = (props: Props) => {
  const { className } = props;
  const schedule = useEngineSelector((engine) => engine.schedule);

  const entries = schedule.tasks.map((entry, idx) => {
    let progressInner;
    if (entry.success === false) {
      progressInner = <span className="text-red-400">[FAIL]</span>;
    } else if (idx === schedule.currentTask?.index) {
      const completionFraction =
        schedule.currentTask.progress / schedule.currentTask.cost;
      progressInner = formatCompletion(completionFraction);
    } else if (!schedule.currentTask || idx < schedule.currentTask.index) {
      progressInner = (
        <span>
          <span className="text-green-400">[ OK ]</span>
        </span>
      );
    } else {
      progressInner = <span>[{"    "}]</span>;
    }

    // We need whitespace-pre here because we pad with spaces.
    // eslint-disable-next-line react/no-array-index-key
    return (
      <div className="flex items-center font-mono h-10" key={idx}>
        <span className="inline-block">
          <TaskIcon className="inline" task={entry.kind} /> {entry.completed}/
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
