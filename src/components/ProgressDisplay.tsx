import { Level, ProgressId, PROGRESS_NAME } from "../engine";

type Props = {
  kind: ProgressId;
  level: Level;
};

export const ProgressDisplay = (props: Props) => {
  const { kind, level } = props;
  let levelDisplay = level.level.toString() + "%";
  const progressPercent = Math.floor((100 * level.xp) / level.totalToNextLevel);
  return (
    <div>
      <strong>{PROGRESS_NAME[kind]}</strong>: {levelDisplay} ({progressPercent}
      %)
    </div>
  );
};
ProgressDisplay.displayName = "ProgresssDisplay";
