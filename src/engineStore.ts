import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppThunkAction } from "./store";
import { original } from "immer";
import { Engine, TaskQueue, TaskKind, SimulationResult, TASKS } from "./engine";
import { project } from "./viewModel";

type TickPayload = {
  now: number; // as in new Date().getTime()
  autoRestart: boolean;
  autoRestartOnFailure: boolean;
};

// TODO: Change these reducers to actually be pure. No calling getTime. Mutation should be moved into middleware.
export const engineSlice = createSlice({
  name: "engine",
  initialState: () => {
    const engine = Engine.loadFromStorage();
    return {
      engine,
      view: project(engine),
      nextQueue: [] as TaskQueue,
      simulation: [] as SimulationResult,
      /**
       * Note: this is "load-bearing" in that changing it forces Redux to think
       * that the store has changed. You need to update this every time you tick
       * the engine!
       */
      lastUpdate: new Date().getTime(),
    };
  },
  reducers: {
    hardReset: () => {
      const engine = new Engine();
      return {
        engine: engine,
        view: project(engine),
        settings: { autoRestart: true },
        nextQueue: [],
        simulation: [],
        lastUpdate: new Date().getTime(),
      };
    },
    startLoop: (state) => {
      state.engine.startLoop(original(state.nextQueue)!);
      state.simulation = state.engine.simulation(state.nextQueue);
      state.view = project(state.engine as any as Engine);
      state.lastUpdate = new Date().getTime();
      state.engine.saveToStorage();
    },
    nextTask: (state) => {
      state.engine.nextTask();
      state.view = project(state.engine as any as Engine);
      state.lastUpdate = new Date().getTime();
    },
    tickWithSettings: {
      reducer(state, action: PayloadAction<TickPayload>) {
        const { now, autoRestart, autoRestartOnFailure } = action.payload;
        const dt = now - state.lastUpdate;
        const { ok } = state.engine.tickTime(dt);
        const shouldRestart =
          (!ok && autoRestartOnFailure) ||
          (ok && !state.engine.schedule.task && autoRestart);
        if (shouldRestart) {
          state.simulation = state.engine.simulation(state.nextQueue);
          state.engine.startLoop(original(state.nextQueue)!);
          state.engine.saveToStorage();
        }
        state.lastUpdate = now;
        state.view = project(state.engine as any as Engine);
      },
      prepare(payload: {
        autoRestart: boolean;
        autoRestartOnFailure: boolean;
      }) {
        return { payload: { now: new Date().getTime(), ...payload } };
      },
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
      state.simulation = state.engine.simulation(state.nextQueue);
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
      state.simulation = state.engine.simulation(state.nextQueue);
    },

    /**
     * Set the batch count to the largest possible. The index-th task *must*
     * have a defined maxIterations function.
     */
    setBatchCountToMax: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      const queue = state.nextQueue;
      const maxIterations = TASKS[queue[index].task].maxIterations!(
        state.engine as any
      );
      queue[index].count = maxIterations;
      state.simulation = state.engine.simulation(state.nextQueue);
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
      state.simulation = state.engine.simulation(state.nextQueue);
    },

    /** Removes a task entirely from the queue. */
    removeTask: (state, action: PayloadAction<number>) => {
      const queue = state.nextQueue;
      const index = action.payload;
      checkBounds(queue, index);
      queue.splice(index, 1);
      state.simulation = state.engine.simulation(state.nextQueue);
    },
  },
});

export const {
  hardReset,
  startLoop,
  nextTask,
  pushTaskToQueue,
  modifyBatchCount,
  setBatchCountToMax,
  moveTask,
  removeTask,
} = engineSlice.actions;

export const tick = (): AppThunkAction => (dispatch, getState) => {
  const { settings } = getState();
  dispatch(engineSlice.actions.tickWithSettings(settings));
};

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
