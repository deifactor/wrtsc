import { useRef } from "react";
import { exportSave, importSave } from "../save";
import {
  setAutoRestart,
  setCheatMode,
  setPauseOnFailure,
  setSpeedrunMode,
} from "../settingsStore";
import { useAppDispatch, useAppSelector } from "../store";
import { hardReset } from "../worldStore";
import { Button } from "./common/Button";
import { Switch } from "./common/Switch";

export const SettingsPanel = () => {
  const dispatch = useAppDispatch();
  const autoRestart = useAppSelector((store) => store.settings.autoRestart);
  const autoRestartOnFailure = useAppSelector(
    (store) => store.settings.pauseOnFailure
  );
  const speedrunMode = useAppSelector((store) => store.settings.speedrunMode);
  const cheatMode = useAppSelector((store) => store.settings.cheatMode);
  const saveRef = useRef<HTMLTextAreaElement>(null);

  const onExport = () => {
    const exported = dispatch(exportSave());
    saveRef.current!.value = exported;
  };
  const onImport = () => {
    const saveString = saveRef.current!.value;
    try {
      dispatch(importSave(saveString));
    } catch (e) {
      // yeah, yeah. simpler than real error handling.
      alert(e);
    }
  };
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
          <Button kind="danger" onClick={onImport}>
            Import Save
          </Button>
        </div>
      </div>
      <div className="mt-12">
        Warning: This will <em>delete your entire save</em>. This is not a
        prestige. There is no backup!
        <div>
          <Button kind="danger" onClick={() => dispatch(hardReset())}>
            Hard Reset
          </Button>
        </div>
      </div>
      <hr className="border-gray-400 my-4" />
      <h1>Cheats</h1>
      <div>
        <Switch
          checked={cheatMode}
          onChange={(checked) => dispatch(setCheatMode(checked))}
        >
          Enable cheats. This shows the rest of the cheat-mode settings and
          enables some extra actions. This will turn off autosaves since the
          developer uses it to debug; to manually save, just export your save
          and then immediately reimport.
        </Switch>
        {cheatMode && (
          <div>
            <Switch
              checked={speedrunMode}
              onChange={(checked) => dispatch(setSpeedrunMode(checked))}
            >
              Speedrun Mode. This runs the game at a massively increased
              tickspeed, making loops complete basically instantly. Loops will
              not automatically restart if this is on, since otherwise you'd
              just complete everything hundreds of times instantly.
            </Switch>
          </div>
        )}
      </div>
    </div>
  );
};
SettingsPanel.displayName = "SettingsPanel";
