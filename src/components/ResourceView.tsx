import { observer } from "mobx-react-lite";
import { Resource } from "../player";

type Props = {
  resource: Resource;
};

export const ResourceView = observer((props: Props) => {
  const { resource } = props;
  return (
    <div>
      <strong>{resource.name}</strong>: {resource.current}/{resource.max()}
    </div>
  );
});
ResourceView.displayName = "ResourceView";
