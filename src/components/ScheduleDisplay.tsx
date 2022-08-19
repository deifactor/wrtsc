import classNames from "classnames";
import { TaskIcon } from "./common/TaskIcon";
import { useEngineSelector } from "../engineStore";

interface Props {
  className?: string;
}

function formatCompletion(frac: number): string {
  const percent = (frac * 100).toFixed(0).padStart(3, " ");
  return `[${percent}%]`;
}

export const ScheduleDisplay = (props: Props) => {
  const { className } = props;
  const schedule = useEngineSelector((engine) => {
    const schedule = engine.schedule;
    return {
      tasks: schedule.queue.map(({ task, count }, index) => ({
        kind: task,
        count,
        completed: schedule.completions(index),
      })),
      currentTask: schedule.task && {
        index: schedule.task.index,
        cost: schedule.task.cost(engine),
        iteration: schedule.task.iteration,
        progress: schedule.task.cost(engine) - schedule.timeLeftOnTask,
      },
    };
  });

  const completionFraction =
    schedule.currentTask &&
    schedule.currentTask.progress / schedule.currentTask.cost;

  const entries = schedule.tasks.map((entry, idx) => {
    const isCurrent = idx === schedule.currentTask?.index;
    // We need whitespace-pre here because we pad with spaces.
    const progressSpan = isCurrent && (
      <span className="inline-block ml-auto whitespace-pre">
        {formatCompletion(completionFraction!)}
      </span>
    );
    // eslint-disable-next-line react/no-array-index-key
    return (
      <div className="flex my-1" key={idx}>
        <span className="inline-block">
          <TaskIcon className="inline align-sub" task={entry.kind} />{" "}
          {entry.completed}/{entry.count}{" "}
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
