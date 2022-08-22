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
    if (idx === schedule.currentTask?.index) {
      const completionFraction =
        schedule.currentTask.progress / schedule.currentTask.cost;
      progressInner = formatCompletion(completionFraction);
    } else if (!schedule.currentTask || idx < schedule.currentTask.index) {
      progressInner = (
        <span>
          <span className="text-green-400">[ OK!]</span>
        </span>
      );
    } else {
      progressInner = null;
    }
    // We need whitespace-pre here because we pad with spaces.
    const progressSpan = (
      <span className="inline-block ml-auto whitespace-pre font-bold">
        {progressInner}
      </span>
    );
    // eslint-disable-next-line react/no-array-index-key
    return (
      <div className="flex my-1 font-mono text-lg" key={idx}>
        <span className="inline-block">
          <TaskIcon className="inline" task={entry.kind} /> {entry.completed}/
          {entry.count}{" "}
        </span>
        {progressSpan}
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
