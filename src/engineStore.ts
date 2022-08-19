import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { original } from "immer";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { Engine, TaskQueue, TaskKind, SimulationResult } from "./engine";

export type Settings = {
  autoRestart: boolean;
};

export const engineSlice = createSlice({
  name: "engine",
  initialState: () => ({
    engine: Engine.loadFromStorage(),
    settings: { autoRestart: true },
    nextQueue: [] as TaskQueue,
    simulation: [] as SimulationResult,
    /**
     * Note: this is "load-bearing" in that changing it forces Redux to think
     * that the store has changed. You need to update this every time you tick
     * the engine!
     */
    lastUpdate: new Date().getTime(),
  }),
  reducers: {
    hardReset: () => {
      return {
        engine: new Engine(),
        settings: { autoRestart: true },
        nextQueue: [],
        simulation: [],
        lastUpdate: new Date().getTime(),
      };
    },
    startLoop: (state) => {
      state.engine.startLoop(original(state.nextQueue)!);
      state.simulation = state.engine.simulation(state.nextQueue);
      state.lastUpdate = new Date().getTime();
    },
    nextTask: (state) => {
      state.engine.nextTask();
      state.lastUpdate = new Date().getTime();
    },
    tick: (state, action: PayloadAction<number | undefined>) => {
      const now = new Date().getTime();
      const dt =
        action.payload !== undefined ? action.payload : now - state.lastUpdate;
      state.engine.tickTime(dt);
      if (state.settings.autoRestart && !state.engine.schedule.task) {
        state.simulation = state.engine.simulation(state.nextQueue);
        state.engine.startLoop(original(state.nextQueue)!);
      }
      state.lastUpdate = now;
      state.engine.saveToStorage();
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
  tick,
  nextTask,
  pushTaskToQueue,
  modifyBatchCount,
  moveTask,
  removeTask,
} = engineSlice.actions;

export const store = configureStore({
  reducer: {
    engine: engineSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: ["engine.engine"],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export function useEngineSelector<T>(selector: (engine: Engine) => T): T {
  return useSelector<RootState, T>(
    (store) => selector(store.engine.engine),
    equal
  );
}
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
