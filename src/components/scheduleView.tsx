import { FunctionalComponent, h } from 'preact';
import { observer } from 'mobx-react-lite';
import { Schedule } from '../schedule';

interface Props {
  schedule: Schedule
}

export const ScheduleView: FunctionalComponent<Props> = observer((props: Props) => {
  const { schedule } = props;
  const entries = schedule.queue.entries.map((entry, idx) => (
    // eslint-disable-next-line react/no-array-index-key
    <div key={idx}>
      {entry.task.name} {schedule.completions(idx)}/{entry.count}
    </div>
  ));
  return <div>{entries}</div>;
});
