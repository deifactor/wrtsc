import { ProgressId, PROGRESS_NAME } from "../engine";
import { useEngineSelector } from "../store";

type Props = {
  id: ProgressId;
};

export const ProgressDisplay = (props: Props) => {
  const { id } = props;
  const { level, xp, totalToNextLevel, visible } = useEngineSelector(
    (engine) => engine.progress[id]
  );
  if (!visible) {
    return null;
  }
  let levelDisplay = level.toString() + "%";
  const progressPercent = Math.floor((100 * xp) / totalToNextLevel);
  return (
    <div>
      <strong>{PROGRESS_NAME[id]}</strong>: {levelDisplay} ({progressPercent}
      %)
    </div>
  );
};
ProgressDisplay.displayName = "ProgresssDisplay";
