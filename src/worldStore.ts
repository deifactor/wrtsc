import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction } from "./store";
import { QueueEngine } from "./engine";
import { EngineView, project } from "./viewModel";
import { saveAction, saveLoaded } from "./save";
import { SubroutineId } from "./engine/simulant";

export const worldSlice = createSlice({
  name: "world",
  initialState: () => {
    const engine = new QueueEngine();
    return {
      view: project(engine),
      lastUpdate: new Date().getTime(),
      unspentTime: 0,
      useUnspentTime: false,
      paused: true,
    };
  },
  reducers: {
    setLastUpdate: (state, action: PayloadAction<number>) => {
      const now = action.payload;
      state.unspentTime += now - state.lastUpdate;
      state.lastUpdate = now;
    },

    ticked: (state, action: PayloadAction<number>) => {
      state.unspentTime -= action.payload;
      if (state.unspentTime < 0) {
        console.error("Somehow got to negative unspent time");
        state.unspentTime = 0;
      }
    },

    setView: (state, action: PayloadAction<EngineView>) => {
      state.view = action.payload;
    },

    setPaused: (state, action: PayloadAction<boolean>) => {
      state.paused = action.payload;
    },

    setUseUnspentTime: (state, action: PayloadAction<boolean>) => {
      state.useUnspentTime = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase(saveLoaded, (state, action) => {
      const world = action.payload.world;
      state.lastUpdate = world.lastUpdate;
      state.unspentTime = world.unspentTime;
    });
  },
});

export const { setPaused, setView, setUseUnspentTime } = worldSlice.actions;

export function tick(now: number = new Date().getTime()): AppThunkAction {
  return (dispatch, getState, { engine }) => {
    let dt = now - getState().world.lastUpdate;
    dispatch(worldSlice.actions.setLastUpdate(now));
    if (getState().world.paused) {
      return;
    }
    const speedrunMode = getState().settings.speedrunMode;
    if (speedrunMode) {
      dt *= 1000;
    } else if (
      getState().world.unspentTime > 0 &&
      getState().world.useUnspentTime
    ) {
      dt = Math.min(3 * dt, getState().world.unspentTime);
    }
    const { autoRestart, pauseOnFailure } = getState().settings;
    const { ok } = engine.tickTime(dt);
    dispatch(worldSlice.actions.ticked(dt));
    if (!ok && pauseOnFailure) {
      dispatch(setPaused(true));
    }
    if (!speedrunMode && ok && !engine.task && autoRestart) {
      engine.startLoop(getState().nextQueue.queue);
      dispatch(startLoop());
    }
    dispatch(worldSlice.actions.setView(project(engine)));
  };
}

/**
 * As `tick`, but takes the size of the timestamp instead. This is mostly useful
 * for tests so we don't have to keep doing `lastUpdate + 100` or whatever everywhere.
 */
export function tickDelta(delta: number): AppThunkAction {
  return (dispatch, getState, { engine }) => {
    const lastUpdate = getState().world.lastUpdate;
    dispatch(tick(lastUpdate + delta));
  };
}

export const startLoop: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    engine.startLoop(getState().nextQueue.queue);
    // Pause if the engine is empty so we properly accumulate bonus time.
    dispatch(setPaused(engine.queue.length === 0));
    dispatch(saveAction());
  };

export const hardReset: () => AppThunkAction =
  () => (dispatch, _getState, extra) => {
    extra.engine = new QueueEngine();
    dispatch(startLoop());
  };

/** Unlocks the given simulant subroutine. */
export function unlockSubroutine(id: SubroutineId): AppThunkAction {
  return (dispatch, _getState, { engine }) => {
    engine.simulant.unlock(id);
    dispatch(saveAction());
  };
}
