import { observer } from "mobx-react-lite";
import { Zone } from "../zone";

type Props = {
  zone: Zone;
  className?: string;
};

export const ZoneView = observer((props: Props) => {
  const { zone, className } = props;
  return (
    <div className={className}>
      <h1>Location</h1>
      <h2>{zone.name}</h2>
      <p>{zone.description}</p>
    </div>
  );
});
