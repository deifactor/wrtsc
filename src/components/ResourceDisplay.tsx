import React from "react";
import { ResourceId, RESOURCE_NAME } from "../engine";

type Props = {
  kind: ResourceId;
  amount: number;
  max: number;
};

export const ResourceDisplay = React.memo((props: Props) => {
  const { kind, amount, max } = props;
  return (
    <div>
      <strong>{RESOURCE_NAME[kind]}</strong>: {amount}/{max}
    </div>
  );
});
ResourceDisplay.displayName = "ResourceDisplay";
