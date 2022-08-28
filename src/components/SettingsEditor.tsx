import {
  setAutoRestart,
  setAutoRestartOnFailure,
  setSpeedrunMode,
} from "../settingsStore";
import { useAppDispatch, useAppSelector } from "../store";
import { Button } from "./common/Button";
import { Switch } from "./common/Switch";

type Props = {
  onHardReset: () => void;
};

export const SettingsEditor = ({ onHardReset }: Props) => {
  const dispatch = useAppDispatch();
  const autoRestart = useAppSelector((store) => store.settings.autoRestart);
  const autoRestartOnFailure = useAppSelector(
    (store) => store.settings.autoRestartOnFailure
  );
  const speedrunMode = useAppSelector((store) => store.settings.speedrunMode);
  return (
    <div>
      <Button kind="danger" onClick={onHardReset}>
        Hard Reset
      </Button>
      <Switch
        checked={autoRestart}
        onChange={(checked) => dispatch(setAutoRestart(checked))}
      >
        Auto-restart
      </Switch>
      <Switch
        checked={autoRestartOnFailure}
        onChange={(checked) => dispatch(setAutoRestartOnFailure(checked))}
      >
        Auto-restart on failure
      </Switch>
      <Switch
        checked={speedrunMode}
        onChange={(checked) => dispatch(setSpeedrunMode(checked))}
      >
        Speedrun Mode
      </Switch>
    </div>
  );
};
SettingsEditor.displayName = "SettingsEditor";
