/**
 * Logic for saving/loading the game. We implement this ourselves instead of
 * using redux-persist because we need to save the engine as well, which isn't
 * stored in the store.
 *
 * To use this in a store, use `extraReducers` and listen for `saveLoaded`.
 */
import { createAction } from "@reduxjs/toolkit";
import { EngineSave, TaskQueue, toEngineSave } from "./engine";
import { Settings } from "./settingsStore";
import { AppThunkAction, RootState } from "./store";

export type GameSave = {
  world: {
    engine: EngineSave;
    nextQueue: TaskQueue;
    lastUpdate: number;
    unspentTime: number;
  };
  settings: Settings;
};

export const STORAGE_KEY = "save";

export function hasSave(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== undefined;
}

function toSave(state: RootState): GameSave {
  return {
    world: {
      nextQueue: state.nextQueue.queue,
      lastUpdate: state.world.lastUpdate,
      unspentTime: state.world.unspentTime,
      engine: toEngineSave(state.world.engine),
    },
    settings: state.settings,
  };
}

export function saveAction(): AppThunkAction {
  return (_dispatch, getState) => {
    if (!getState().settings.cheatMode) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave(getState())));
    }
  };
}

export function loadAction(): AppThunkAction {
  return (dispatch) => {
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (!stringified) {
      return;
    }
    dispatch(loadSave(JSON.parse(stringified) as GameSave));
  };
}

/** Returns the current save as a string, suitable for export/import. */
export function exportSave(): AppThunkAction<string> {
  return (_dispatch, getState) => {
    const save = toSave(getState());
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
 * _after_ any thunk-y save loading has occurred (i.e., `extra.engine` has been set).
 */
export const loadSave = createAction<GameSave>("loadSave");
