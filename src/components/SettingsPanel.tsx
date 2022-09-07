import { useRef } from "react";
import { exportSave } from "../save";
import {
  setAutoRestart,
  setPauseOnFailure,
  setSpeedrunMode,
} from "../settingsStore";
import { useAppDispatch, useAppSelector } from "../store";
import { Button } from "./common/Button";
import { Switch } from "./common/Switch";

type Props = {
  onHardReset: () => void;
};

export const SettingsPanel = ({ onHardReset }: Props) => {
  const dispatch = useAppDispatch();
  const autoRestart = useAppSelector((store) => store.settings.autoRestart);
  const autoRestartOnFailure = useAppSelector(
    (store) => store.settings.pauseOnFailure
  );
  const speedrunMode = useAppSelector((store) => store.settings.speedrunMode);
  const saveRef = useRef<HTMLTextAreaElement>(null);

  const onExport = () => {
    const exported = dispatch(exportSave());
    saveRef.current!.value = exported;
  };
  const importSave = () => {};
  return (
    <div>
      <div>
        <Switch
          checked={autoRestart}
          onChange={(checked) => dispatch(setAutoRestart(checked))}
        >
          Auto-restart
        </Switch>
        <Switch
          checked={autoRestartOnFailure}
          onChange={(checked) => dispatch(setPauseOnFailure(checked))}
        >
          Auto-restart on failure
        </Switch>
      </div>
      <div></div>
      <div>
        <Switch
          checked={speedrunMode}
          onChange={(checked) => dispatch(setSpeedrunMode(checked))}
        >
          Speedrun Mode
        </Switch>
      </div>
      <div>
        Export/import save
        <div>
          <textarea
            className="font-mono"
            ref={saveRef}
            cols={80}
            rows={5}
          ></textarea>
        </div>
        <div>
          <Button onClick={onExport}>Export Save</Button>
          <Button kind="danger" onClick={importSave}>
            Import Save
          </Button>
        </div>
      </div>
      <div className="mt-12">
        Warning: This will <em>delete your entire save</em>. This is not a
        prestige. There is no backup!
        <div>
          <Button kind="danger" onClick={onHardReset}>
            Hard Reset
          </Button>
        </div>
      </div>
    </div>
  );
};
SettingsPanel.displayName = "SettingsPanel";
