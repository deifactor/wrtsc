import { ProgressId, PROGRESS_NAME } from "../engine";
import { useEngineSelector } from "../engineStore";

type Props = {
  kind: ProgressId;
};

export const ProgressDisplay = (props: Props) => {
  const { kind } = props;
  const level = useEngineSelector((engine) => engine.progress[kind].level);
  const xp = useEngineSelector((engine) => engine.progress[kind].xp);
  const totalToNextLevel = useEngineSelector(
    (engine) => engine.progress[kind].totalToNextLevel
  );
  let levelDisplay = level.toString() + "%";
  const progressPercent = Math.floor((100 * xp) / totalToNextLevel);
  return (
    <div>
      <strong>{PROGRESS_NAME[kind]}</strong>: {levelDisplay} ({progressPercent}
      %)
    </div>
  );
};
ProgressDisplay.displayName = "ProgresssDisplay";
