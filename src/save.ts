/**
 * Logic for saving/loading the game. We implement this ourselves instead of
 * using redux-persist because we need to save the engine as well, which isn't
 * stored in the store.
 *
 * To use this in a store, use `extraReducers` and listen for `saveLoaded`.
 */
import { createAction } from "@reduxjs/toolkit";
import {
  Engine,
  EngineSave,
  makeEngine,
  TaskQueue,
  toEngineSave,
} from "./engine";
import { QueueSchedule } from "./engine/schedule";
import { Settings } from "./settingsStore";
import { AppThunkAction, RootState } from "./store";
import { project } from "./viewModel";
import { setView } from "./worldStore";

export type GameSave = {
  state: {
    world: {
      nextQueue: TaskQueue;
      lastUpdate: number;
      unspentTime: number;
    };
    settings: Settings;
  };
  engine: EngineSave;
};

export const STORAGE_KEY = "save";

export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== undefined;
}

function toSave(state: RootState, engine: Engine): GameSave {
  return {
    state: {
      world: {
        nextQueue: state.nextQueue.queue,
        lastUpdate: state.world.lastUpdate,
        unspentTime: state.world.unspentTime,
      },
      settings: state.settings,
    },
    engine: toEngineSave(engine),
  };
}

export function saveAction(): AppThunkAction {
  return (_dispatch, getState, { engine }) => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(toSave(getState(), engine))
    );
  };
}

export function loadAction(): AppThunkAction {
  return (dispatch, _getState, extra) => {
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (!stringified) {
      return;
    }
    const save: GameSave = JSON.parse(stringified);
    extra.engine = makeEngine(new QueueSchedule([]), save.engine);
    dispatch(setView(project(extra.engine)));
    dispatch(saveLoaded(save.state));
  };
}

/** Returns the current save as a string, suitable for export/import. */
export function exportSave(): AppThunkAction<string> {
  return (_dispatch, getState, { engine }) => {
    const save = toSave(getState(), engine);
    return JSON.stringify(save);
  };
}

export function importSave(saveString: string): AppThunkAction {
  return (dispatch) => {
    // Make sure the save is valid before we even try to set it.
    JSON.parse(saveString);
    localStorage.setItem(STORAGE_KEY, saveString);
    dispatch(loadAction());
  };
}

/**
 * Dispatched after the game's save has been loaded. This is guaranteed to run
 * *after* any thunk-y save loading has occurred (i.e., `extra.engine` has been set).
 */
export const saveLoaded = createAction<GameSave["state"]>("saveLoaded");
