import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction } from "./store";
import { QueueEngine, TaskQueue, TaskId, SimulationResult } from "./engine";
import { EngineView, project } from "./viewModel";
import { startAppListening } from "./listener";
import { saveAction, saveLoaded } from "./save";
import { SubroutineId } from "./engine/simulant";

export const worldSlice = createSlice({
  name: "world",
  initialState: () => {
    const engine = new QueueEngine();
    return {
      // This is a function that closes over a constant variable to prevent the
      // type inference from converting it to a WritableDraft<QueueEngine>.
      view: project(engine),
      nextQueue: [] as TaskQueue,
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

    /**
     * Push a task to the end of the queue. If the last task in the queue is the
     * given kind, increments its count by 1 instead.
     */
    pushTaskToQueue: (state, action: PayloadAction<TaskId>) => {
      const queue = state.nextQueue;
      const id = action.payload;
      const len = queue.length;
      if (len !== 0 && queue[len - 1].task === action.payload) {
        queue[queue.length - 1].count++;
      } else {
        queue.push({ task: id, count: 1 });
      }
    },

    /**
     * Modify the number of times we perform the index-th task. If this results
     * in the count being negative, we remove the entry.
     */
    modifyBatchCount: (
      state,
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      const { index, amount } = action.payload;
      const queue = state.nextQueue;
      checkBounds(queue, index);
      const entry = queue[index];
      entry.count += amount;
      if (entry.count <= 0) {
        queue.splice(index, 1);
      }
    },

    /**
     * Set the batch count to the largest possible. The index-th task *must*
     * have a defined maxIterations function.
     */
    setBatchCountToMax: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      const queue = state.nextQueue;
      const id = queue[index].task;
      const maxIterations = state.view.tasks[id].maxIterations!;
      queue[index].count = maxIterations;
    },

    /**
     * Move the task at `from` to the position `to`. Throws if either of those
     * is out of bounds.
     */
    moveTask: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const queue = state.nextQueue;
      const { from, to } = action.payload;
      checkBounds(queue, from);
      checkBounds(queue, to);
      // Yes, this works no matter what `from` and `to` are. Unit test it anyway
      // though.
      const entry = queue[from];
      queue.splice(from, 1);
      queue.splice(to, 0, entry);
    },

    /** Removes a task entirely from the queue. */
    removeTask: (state, action: PayloadAction<number>) => {
      const queue = state.nextQueue;
      const index = action.payload;
      checkBounds(queue, index);
      queue.splice(index, 1);
    },
  },

  extraReducers(builder) {
    builder.addCase(saveLoaded, (state, action) => {
      const world = action.payload.world;
      state.nextQueue = world.nextQueue;
      state.lastUpdate = world.lastUpdate;
      state.unspentTime = world.unspentTime;
    });
  },
});

export const {
  pushTaskToQueue,
  modifyBatchCount,
  setBatchCountToMax,
  moveTask,
  removeTask,
  setPaused,
  setView,
} = worldSlice.actions;

// Whenever we modify the task queue, update the simulation. In the future we
// may want to do some fancy debouncing logic.
startAppListening({
  matcher: isAnyOf(
    pushTaskToQueue,
    modifyBatchCount,
    setBatchCountToMax,
    moveTask,
    removeTask,
    saveLoaded
  ),
  effect(_action, api) {
    const state = api.getState().world;
    api.dispatch(
      worldSlice.actions.setSimulation(
        api.extra.engine.simulation(state.nextQueue)
      )
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
      engine.startLoop(getState().world.nextQueue);
      dispatch(startLoop());
    }
    dispatch(worldSlice.actions.setView(project(engine)));
  };

export const startLoop: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    engine.startLoop(getState().world.nextQueue);
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

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
