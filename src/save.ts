/**
 * Logic for saving/loading the game. We implement this ourselves instead of
 * using redux-persist because we need to save the engine as well, which isn't
 * stored in the store.
 *
 * To use this in a store, use `extraReducers` and listen for `saveLoaded`.
 */
import { createAction } from "@reduxjs/toolkit";
import { EngineSave, QueueEngine, TaskQueue } from "./engine";
import { Settings } from "./settingsStore";
import { AppThunkAction } from "./store";
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

export function saveAction(): AppThunkAction {
  return (_dispatch, getState, extra) => {
    const state = getState();
    const save: GameSave = {
      state: {
        world: {
          nextQueue: state.world.nextQueue,
          lastUpdate: state.world.lastUpdate,
          unspentTime: state.world.unspentTime,
        },
        settings: state.settings,
      },
      engine: extra.engine.toSave(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  };
}

export function loadAction(): AppThunkAction {
  return (dispatch, _getState, extra) => {
    const stringified = localStorage.getItem(STORAGE_KEY);
    if (!stringified) {
      return;
    }
    const save: GameSave = JSON.parse(stringified);
    extra.engine = new QueueEngine(save.engine);
    dispatch(setView(project(extra.engine)));
    dispatch(saveLoaded(save.state));
  };
}

/**
 * Dispatched after the game's save has been loaded. This is guaranteed to run
 * *after* any thunk-y save loading has occurred (i.e., `extra.engine` has been set).
 */
export const saveLoaded = createAction<GameSave["state"]>("saveLoaded");
