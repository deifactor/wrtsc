import { observer } from "mobx-react-lite";
import { Schedule } from "../schedule";
import { TASKS } from "../task";

interface Props {
  schedule: Schedule;
  className?: string;
}

function formatCompletion(frac: number): string {
  const percent = (frac * 100).toFixed(0).padStart(3, " ");
  return `[${percent}%]`;
}

export const ScheduleView = observer((props: Props) => {
  const { className, schedule } = props;
  const completionFraction =
    schedule.task && schedule.timeOnTask / schedule.task.baseCost;

  const entries = schedule.queue.entries.map((entry, idx) => {
    const isCurrent = idx === schedule.task?.index;
    // We need whitespace-pre here because we pad with spaces.
    const progressSpan = isCurrent && (
      <span className="inline-block ml-auto whitespace-pre">
        {formatCompletion(completionFraction!)}
      </span>
    );
    // eslint-disable-next-line react/no-array-index-key
    return (
      <div className="flex" key={idx}>
        <span className="inline-block">
          {entry.task.name} {schedule.completions(idx)}/{entry.count}{" "}
        </span>
        {progressSpan}
      </div>
    );
  });
  return (
    <div className={className}>
      <h1>Schedule</h1>
      {entries}
    </div>
  );
});
