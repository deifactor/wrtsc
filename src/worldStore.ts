import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction } from "./store";
import { QueueEngine, SimulationResult } from "./engine";
import { EngineView, project } from "./viewModel";
import { startAppListening } from "./listener";
import { saveAction, saveLoaded } from "./save";
import { SubroutineId } from "./engine/simulant";
import {
  modifyBatchCount,
  moveTask,
  pushTaskToQueue,
  removeTask,
  setBatchCount,
} from "./nextQueueStore";

export const worldSlice = createSlice({
  name: "world",
  initialState: () => {
    const engine = new QueueEngine();
    return {
      view: project(engine),
      simulation: [] as SimulationResult,
      lastUpdate: new Date().getTime(),
      // Amount of time that has passed in updates but hasn't yet been simulated.
      unspentTime: 0,
      paused: true,
    };
  },
  reducers: {
    setSimulation: (state, action: PayloadAction<SimulationResult>) => {
      state.simulation = action.payload;
    },

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
  },

  extraReducers(builder) {
    builder.addCase(saveLoaded, (state, action) => {
      const world = action.payload.world;
      state.lastUpdate = world.lastUpdate;
      state.unspentTime = world.unspentTime;
    });
  },
});

export const { setPaused, setView } = worldSlice.actions;

// Whenever we modify the task queue, update the simulation. In the future we
// may want to do some fancy debouncing logic.
startAppListening({
  matcher: isAnyOf(
    pushTaskToQueue,
    modifyBatchCount,
    setBatchCount,
    moveTask,
    removeTask,
    saveLoaded
  ),
  effect(_action, api) {
    const state = api.getState().nextQueue;
    api.dispatch(
      worldSlice.actions.setSimulation(api.extra.engine.simulation(state))
    );
  },
});

export const tick: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    const now = new Date().getTime();
    let dt = now - getState().world.lastUpdate;
    dispatch(worldSlice.actions.setLastUpdate(now));
    if (getState().world.paused) {
      return;
    }
    const speedrunMode = getState().settings.speedrunMode;
    if (speedrunMode) {
      dt *= 1000;
    } else if (getState().world.unspentTime > 0) {
      dt = Math.min(3 * dt, getState().world.unspentTime);
    }
    const { autoRestart, pauseOnFailure } = getState().settings;
    const { ok } = engine.tickTime(dt);
    dispatch(worldSlice.actions.ticked(dt));
    if (!ok && pauseOnFailure) {
      dispatch(setPaused(true));
    }
    if (!speedrunMode && ok && !engine.task && autoRestart) {
      engine.startLoop(getState().nextQueue);
      dispatch(startLoop());
    }
    dispatch(worldSlice.actions.setView(project(engine)));
  };

export const startLoop: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    engine.startLoop(getState().nextQueue);
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
