import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction } from "./store";
import { Engine, TaskQueue, TaskKind, SimulationResult } from "./engine";
import { EngineView, project } from "./viewModel";
import { startAppListening } from "./listener";

export const engineSlice = createSlice({
  name: "engine",
  initialState: () => {
    const engine = Engine.loadFromStorage();
    return {
      // This is a function that closes over a constant variable to prevent the
      // type inference from converting it to a WritableDraft<Engine>.
      view: project(engine),
      nextQueue: [] as TaskQueue,
      simulation: [] as SimulationResult,
      lastUpdate: new Date().getTime(),
    };
  },
  reducers: {
    setSimulation: (state, action: PayloadAction<SimulationResult>) => {
      state.simulation = action.payload;
    },

    setLastUpdate: (state, action: PayloadAction<number>) => {
      state.lastUpdate = action.payload;
    },

    setView: (state, action: PayloadAction<EngineView>) => {
      state.view = action.payload;
    },

    /**
     * Push a task to the end of the queue. If the last task in the queue is the
     * given kind, increments its count by 1 instead.
     */
    pushTaskToQueue: (state, action: PayloadAction<TaskKind>) => {
      const queue = state.nextQueue;
      const kind = action.payload;
      const len = queue.length;
      if (len !== 0 && queue[len - 1].task === action.payload) {
        queue[queue.length - 1].count++;
      } else {
        queue.push({ task: kind, count: 1 });
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
});

export const {
  pushTaskToQueue,
  modifyBatchCount,
  setBatchCountToMax,
  moveTask,
  removeTask,
} = engineSlice.actions;

// Whenever we modify the task queue, update the simulation. In the future we
// may want to do some fancy debouncing logic.
startAppListening({
  matcher: isAnyOf(
    pushTaskToQueue,
    modifyBatchCount,
    setBatchCountToMax,
    moveTask,
    removeTask
  ),
  effect(_action, api) {
    const state = api.getState().engine;
    api.dispatch(
      engineSlice.actions.setSimulation(
        api.extra.engine.simulation(state.nextQueue)
      )
    );
  },
});

export const tick: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    const now = new Date().getTime();
    const speedrunMode = getState().settings.speedrunMode;
    const { autoRestart, autoRestartOnFailure } = getState().settings;
    const dt = (speedrunMode ? 1000 : 1) * (now - getState().engine.lastUpdate);
    const { ok } = engine.tickTime(dt);
    const shouldRestart =
      (!ok && autoRestartOnFailure) ||
      (ok && !engine.schedule.task && autoRestart);
    if (!speedrunMode && shouldRestart) {
      engine.startLoop(getState().engine.nextQueue);
      dispatch(startLoop());
    }
    dispatch(engineSlice.actions.setLastUpdate(now));
    dispatch(engineSlice.actions.setView(project(engine)));
  };

export const startLoop: () => AppThunkAction =
  () =>
  (dispatch, getState, { engine }) => {
    engine.startLoop(getState().engine.nextQueue);
    engine.saveToStorage();
    dispatch(engineSlice.actions.setLastUpdate(new Date().getTime()));
  };

export const hardReset: () => AppThunkAction =
  () => (dispatch, _getState, extra) => {
    extra.engine = new Engine();
    dispatch(startLoop());
  };

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
