import classNames from "classnames";
import { Player, Schedule } from "../engine";
import { TaskIcon } from "./common/TaskIcon";

interface Props {
  schedule: Schedule;
  player: Player;
  className?: string;
}

function formatCompletion(frac: number): string {
  const percent = (frac * 100).toFixed(0).padStart(3, " ");
  return `[${percent}%]`;
}

export const ScheduleDisplay = (props: Props) => {
  const { className, schedule, player } = props;
  const completionFraction =
    schedule.task && 1 - schedule.timeLeftOnTask / player.cost(schedule.task);

  const entries = schedule.queue.map((entry, idx) => {
    const isCurrent = idx === schedule.task?.index;
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
          <TaskIcon className="inline align-sub" task={entry.task} />{" "}
          {schedule.completions(idx)}/{entry.count}{" "}
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
