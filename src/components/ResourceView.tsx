import { observer } from "mobx-react-lite";
import { Player, ResourceId, RESOURCE_NAME } from "../player";

type Props = {
  kind: ResourceId;
  player: Player;
};

export const ResourceView = observer((props: Props) => {
  const { kind, player } = props;
  return (
    <div>
      <strong>{RESOURCE_NAME[kind]}</strong>: {player.resources[kind]}/
      {player.maxResource(kind)}
    </div>
  );
});
ResourceView.displayName = "ResourceView";
