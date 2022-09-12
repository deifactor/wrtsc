import { AnyAction, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction, RootState } from "./store";
import { Engine, TaskId, TaskQueue, tickTime } from "./engine";
import * as e from "./engine";
import { EngineView, project } from "./viewModel";
import { saveAction, saveLoaded } from "./save";
import { SubroutineId } from "./engine/simulant";
import * as sim from "./engine/simulant";
import { QueueSchedule, Schedule } from "./engine/schedule";

interface Completions {
  total: number;
  success: number;
  failure: number;
}

interface Completions {
  total: number;
  success: number;
  failure: number;
}

export const worldSlice = createSlice({
  name: "world",
  initialState: () => {
    const engine = new Engine(new QueueSchedule([]));
    return {
      view: project(engine),
      lastUpdate: new Date().getTime(),
      unspentTime: 0,
      useUnspentTime: false,
      paused: true,
      schedule: {
        queue: [] as TaskQueue,
        index: undefined as number | undefined,
        iteration: 0,
        completions: [] as Completions[],
      },
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

    advanceSchedule: ({ schedule }) => {
      if (schedule.index === undefined) {
        schedule.index = 0;
        schedule.iteration = 0;
        return;
      }

      if (schedule.index >= schedule.queue.length) {
        return;
      }

      schedule.iteration++;
      if (schedule.iteration >= schedule.queue[schedule.index].count) {
        schedule.index++;
        schedule.iteration = 0;
      }
    },

    recordResult: ({ schedule }, action: PayloadAction<boolean>) => {
      if (schedule.index === undefined) {
        throw new Error("Can't record success when we haven't even started");
      } else if (schedule.index >= schedule.queue.length) {
        throw new Error(
          `Can't record when we're done (index ${schedule.index} queue length ${schedule.queue.length})`
        );
      } else {
        const completions = schedule.completions[schedule.index];
        if (action.payload) {
          completions.success++;
        } else {
          completions.failure++;
        }
      }
    },

    restartSchedule: (
      { schedule },
      action: PayloadAction<TaskQueue | undefined>
    ) => {
      if (action.payload) {
        schedule.queue = action.payload;
      }
      schedule.index = undefined;
      schedule.iteration = 0;
      schedule.completions = schedule.queue.map((batch) => ({
        total: batch.count,
        success: 0,
        failure: 0,
      }));
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

const { advanceSchedule, recordResult, restartSchedule } = worldSlice.actions;

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
    const { ok } = tickTime(engine, wrapperSchedule(dispatch, getState), dt);
    dispatch(worldSlice.actions.ticked(dt));
    if (!ok && pauseOnFailure) {
      dispatch(setPaused(true));
    }
    if (!speedrunMode && ok && !engine.taskState?.task && autoRestart) {
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
    const nextQueue = getState().nextQueue.queue;
    dispatch(restartSchedule(nextQueue));
    e.startLoop(engine, wrapperSchedule(dispatch, getState));
    // Pause if the engine is empty so we properly accumulate bonus time.
    dispatch(setPaused(getState().world.schedule.queue.length === 0));
    dispatch(saveAction());
    dispatch(worldSlice.actions.setView(project(engine)));
  };

export const hardReset: () => AppThunkAction =
  () => (dispatch, _getState, extra) => {
    extra.engine = new Engine(new QueueSchedule([]));

    dispatch(startLoop());
    dispatch(worldSlice.actions.setView(project(extra.engine)));
  };

/** Unlocks the given simulant subroutine. */
export function unlockSubroutine(id: SubroutineId): AppThunkAction {
  return (dispatch, _getState, { engine }) => {
    sim.unlockSubroutine(engine, id);
    dispatch(saveAction());
  };
}

function wrapperSchedule(
  dispatch: (action: AnyAction) => void,
  getState: () => RootState
): Schedule {
  return {
    next(): TaskId | undefined {
      dispatch(advanceSchedule());
      const { schedule } = getState().world;
      return schedule.index !== undefined
        ? schedule.queue[schedule.index]?.task
        : undefined;
    },
    recordResult(success: boolean) {
      dispatch(recordResult(success));
    },
    restart() {
      dispatch(restartSchedule());
    },
  };
}
