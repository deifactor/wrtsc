import { Button } from "./common/Button";
import { Switch } from "./common/Switch";

export class Settings {
  autoRestart: boolean = true;
}

type Props = {
  onHardReset: () => void;
  settings: Settings;
};

export const SettingsEditor = ({ onHardReset, settings }: Props) => {
  const setAutoRestart = (value: boolean) => {
    settings.autoRestart = value;
  };
  return (
    <div>
      <Button kind="danger" onClick={onHardReset}>
        Hard Reset
      </Button>
      <Switch checked={settings.autoRestart} onChange={setAutoRestart}>
        Auto-restart
      </Switch>
    </div>
  );
};
SettingsEditor.displayName = "SettingsEditor";
