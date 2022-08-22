import { ProgressId, PROGRESS_NAME } from "../engine";
import { useEngineSelector } from "../store";

type Props = {
  kind: ProgressId;
};

export const ProgressDisplay = (props: Props) => {
  const { kind } = props;
  const { level, xp, totalToNextLevel, visible } = useEngineSelector(
    (engine) => engine.progress[kind]
  );
  if (!visible) {
    return null;
  }
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
