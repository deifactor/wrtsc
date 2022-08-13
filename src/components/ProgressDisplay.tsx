import { ProgressId, PROGRESS_NAME } from "../engine";

type Props = {
  kind: ProgressId;
  level: number;
  xp: number;
  totalToNextLevel: number;
};

export const ProgressDisplay = (props: Props) => {
  const { kind, level, xp, totalToNextLevel } = props;
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
