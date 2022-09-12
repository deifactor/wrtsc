import {
  createSelector,
  createSlice,
  isAnyOf,
  PayloadAction,
} from "@reduxjs/toolkit";
import { AppThunkAction, RootState } from "./store";
import { Engine, makeEngine, TaskId, TaskQueue, tickTime } from "./engine";
import * as e from "./engine";
import { project } from "./viewModel";
import { saveAction, loadSave } from "./save";
import { SubroutineId } from "./engine/simulant";
import * as sim from "./engine/simulant";
import { QueueSchedule, Schedule } from "./engine/schedule";
import { TASKS } from "./engine/task";
import { Settings } from "./settingsStore";
import { startAppListening } from "./listener";
import equal from "fast-deep-equal";

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

/** If we're finished with this particular loop, why are we finished with it? */
type FinishReason = "outOfTasks" | "failure";

export const worldSlice = createSlice({
  name: "world",
  initialState: () => {
    const engine = makeEngine(new QueueSchedule([]));
    return {
      engine: engine,
      view: project(engine),
      lastUpdate: new Date().getTime(),
      unspentTime: 0,
      useUnspentTime: false,
      paused: true,
      /** `undefined` indicates we're still in the middle of the loop. */
      loopFinished: undefined as undefined | FinishReason,
      schedule: {
        queue: [] as TaskQueue,
        index: undefined as number | undefined,
        iteration: 0,
        completions: [] as Completions[],
      },
    };
  },
  reducers: {
    setView: (state) => {
      state.view = project(state.engine);
    },

    setPaused: (state, action: PayloadAction<boolean>) => {
      state.paused = action.payload;
    },

    setUseUnspentTime: (state, action: PayloadAction<boolean>) => {
      state.useUnspentTime = action.payload;
    },

    unlockSubroutine: (state, action: PayloadAction<SubroutineId>) => {
      sim.unlockSubroutine(state.engine, action.payload);
    },

    tickWithSettings: (
      state,
      action: PayloadAction<{ now: number; settings: Settings }>
    ) => {
      const { engine } = state;
      const { now, settings } = action.payload;
      let dt = now - state.lastUpdate;
      state.unspentTime += dt;
      state.lastUpdate = now;
      if (state.paused) {
        return;
      }
      const speedrunMode = settings.speedrunMode;
      if (speedrunMode) {
        dt *= 1000;
      } else if (state.unspentTime > 0 && state.useUnspentTime) {
        dt = Math.min(3 * dt, state.unspentTime);
      }
      const { ok } = tickTime(engine, wrapperSchedule(state), dt);
      state.unspentTime -= dt;
      if (state.unspentTime < 0) {
        console.error("Somehow got to negative unspent time");
        state.unspentTime = 0;
      }
      if (!ok) {
        state.loopFinished = "failure";
      } else if (!state.engine.taskState) {
        state.loopFinished = "outOfTasks";
      } else {
        state.loopFinished = undefined;
      }
      state.view = project(engine);
      worldSlice.caseReducers.setView(state);
    },

    /** Starts a new loop with the given task queue. */
    startLoopWithQueue: (
      state,
      action: PayloadAction<TaskQueue | undefined>
    ) => {
      const { schedule } = state;
      state.loopFinished = undefined;
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
      e.startLoop(state.engine, wrapperSchedule(state));
      state.paused = schedule.queue.length === 0;
      worldSlice.caseReducers.setView(state);
    },
  },

  extraReducers(builder) {
    builder.addCase(loadSave, (state, action) => {
      const world = action.payload.world;
      state.lastUpdate = world.lastUpdate;
      state.unspentTime = world.unspentTime;
    });
  },
});

export const { setPaused, setView, setUseUnspentTime, unlockSubroutine } =
  worldSlice.actions;

const { startLoopWithQueue, tickWithSettings } = worldSlice.actions;

/**
 * As `tick`, but takes the size of the timestamp instead. This is mostly useful
 * for tests so we don't have to keep doing `lastUpdate + 100` or whatever everywhere.
 */
export function tickDelta(delta: number): AppThunkAction {
  return (dispatch, getState) => {
    const lastUpdate = getState().world.lastUpdate;
    dispatch(tick(lastUpdate + delta));
  };
}
export function tick(now: number = new Date().getTime()): AppThunkAction {
  return (dispatch, getState) => {
    const settings = getState().settings;
    dispatch(
      tickWithSettings({
        now,
        settings,
      })
    );
    const { autoRestart, pauseOnFailure } = settings;
    const { loopFinished } = getState().world;
    if (!loopFinished) {
      return;
    }
    if (
      (loopFinished === "failure" && !pauseOnFailure) ||
      (loopFinished === "outOfTasks" && autoRestart)
    ) {
      dispatch(startLoop());
    } else {
      dispatch(setPaused(true));
    }
  };
}

export const startLoop: () => AppThunkAction = () => (dispatch, getState) => {
  const nextQueue = getState().nextQueue.queue;
  dispatch(startLoopWithQueue(nextQueue));
};

export const hardReset: () => AppThunkAction = () => () => {
  // XXX: fixme
  throw new Error("temporarily broken");
};

function wrapperSchedule(
  state: ReturnType<typeof worldSlice.getInitialState>
): Schedule {
  return {
    next(): TaskId | undefined {
      const { schedule } = state;
      if (schedule.index === undefined) {
        schedule.index = 0;
        schedule.iteration = 0;
      } else {
        schedule.iteration++;
        if (schedule.iteration >= schedule.queue[schedule.index].count) {
          schedule.index++;
          schedule.iteration = 0;
        }
      }
      if (schedule.index >= schedule.queue.length) {
        return;
      }
      return schedule.index !== undefined
        ? schedule.queue[schedule.index]?.task
        : undefined;
    },
    recordResult(success: boolean) {
      const { schedule } = state;
      if (schedule.index === undefined) {
        throw new Error("Can't record success when we haven't even started");
      } else if (schedule.index >= schedule.queue.length) {
        throw new Error(
          `Can't record when we're done (index ${schedule.index} queue length ${schedule.queue.length})`
        );
      } else {
        const completions = schedule.completions[schedule.index];
        if (success) {
          completions.success++;
        } else {
          completions.failure++;
        }
      }
    },
  };
}

startAppListening({
  matcher: isAnyOf(unlockSubroutine),
  effect(_action, api) {
    api.dispatch(saveAction());
  },
});

export const selectVisibleTasks = createSelector(
  (state: RootState) => state.world.engine,
  (engine: Engine) =>
    Object.values(TASKS)
      .filter((task) => task.visible(engine))
      .map((task) => task.id),
  { memoizeOptions: { resultEqualityCheck: equal } }
);
