import { Engine } from "../engine";

type Props = {
  engine: Engine;
};

export const PlayerDisplay = (props: Props) => {
  const { engine } = props;
  return (
    <div>
      <div>
        <strong>AEU</strong>: {engine.energy.toFixed(0)}
      </div>
      <p>
        <strong>Combat:</strong> {engine.combat}
      </p>
    </div>
  );
};
PlayerDisplay.displayName = "PlayerDisplay";
