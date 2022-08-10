import { Player, ResourceId, RESOURCE_NAME } from "../engine";

type Props = {
  kind: ResourceId;
  player: Player;
};

export const ResourceDisplay = (props: Props) => {
  const { kind, player } = props;
  return (
    <div>
      <strong>{RESOURCE_NAME[kind]}</strong>: {player.resources[kind]}/
      {player.maxResource(kind)}
    </div>
  );
};
ResourceDisplay.displayName = "ResourceDisplay";
