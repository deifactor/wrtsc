import React from "react";

type Props = {
  energy: number;
  combat: number;
};

export const PlayerDisplay = React.memo((props: Props) => {
  const { energy, combat } = props;
  return (
    <div>
      <div>
        <strong>AEU</strong>: {energy.toFixed(0)}
      </div>
      <p>
        <strong>Combat:</strong> {combat}
      </p>
    </div>
  );
});
PlayerDisplay.displayName = "PlayerDisplay";
