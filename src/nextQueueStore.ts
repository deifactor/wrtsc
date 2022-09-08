import { createSlice, isAnyOf, PayloadAction } from "@reduxjs/toolkit";
import { TaskQueue, TaskId, SimulationResult } from "./engine";
import { startAppListening } from "./listener";
import { saveLoaded } from "./save";

/**
 * This slice manages the task queue/schedule that the user is currently editing
 * (i.e., the one that will be active on the next iteration of the loop).
 */
export const nextQueueSlice = createSlice({
  name: "nextQueue",
  initialState: {
    queue: [] as TaskQueue,
    simulation: [] as SimulationResult,
  },
  reducers: {
    setSimulation: (state, action: PayloadAction<SimulationResult>) => {
      state.simulation = action.payload;
    },

    /**
     * Directly sets the queue. Only call this from save/load mechanisms;
     * mutating the queue using the UI should use the other actions.
     */
    setNextQueue: (state, action: PayloadAction<TaskQueue>) => {
      state.queue = action.payload;
    },

    /**
     * Push a task to the end of the queue. If the last task in the queue is the
     * given kind, increments its count by 1 instead.
     */
    pushTaskToQueue: ({ queue }, action: PayloadAction<TaskId>) => {
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
      { queue },
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      const { index, amount } = action.payload;
      checkBounds(queue, index);
      const entry = queue[index];
      entry.count += amount;
      if (entry.count <= 0) {
        queue.splice(index, 1);
      }
    },

    /** Set the batch count to a fixed number. */
    setBatchCount: (
      { queue },
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      const { index, amount } = action.payload;
      checkBounds(queue, index);
      const entry = queue[index];
      entry.count = amount;
      if (entry.count <= 0) {
        queue.splice(index, 1);
      }
    },

    /**
     * Move the task at `from` to the position `to`. Throws if either of those
     * is out of bounds.
     */
    moveTask: (
      { queue },
      action: PayloadAction<{ from: number; to: number }>
    ) => {
      const { from, to } = action.payload;
      checkBounds(queue, from);
      checkBounds(queue, to);
      // Yes, this works no matter what `from` and `to` are. Unit test it anyway
      // though.
      const entry = queue[from];
      queue.splice(from, 1);
      queue.splice(to, 0, entry);
    },

    /** Removes a task entirely from the state. */
    removeTask: ({ queue }, action: PayloadAction<number>) => {
      const index = action.payload;
      checkBounds(queue, index);
      queue.splice(index, 1);
    },
  },
});

export const {
  pushTaskToQueue,
  modifyBatchCount,
  setBatchCount,
  moveTask,
  removeTask,
  setNextQueue,
} = nextQueueSlice.actions;

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}

// Whenever we modify the task queue, update the simulation. In the future we
// may want to do some fancy debouncing logic.
startAppListening({
  matcher: isAnyOf(
    pushTaskToQueue,
    modifyBatchCount,
    setBatchCount,
    moveTask,
    removeTask,
    setNextQueue
  ),
  effect(_action, api) {
    const { queue } = api.getState().nextQueue;
    api.dispatch(
      nextQueueSlice.actions.setSimulation(api.extra.engine.simulation(queue))
    );
  },
});

// Whenever we modify the task queue, update the simulation. In the future we
// may want to do some fancy debouncing logic.
startAppListening({
  actionCreator: saveLoaded,
  effect(action, api) {
    api.dispatch(
      nextQueueSlice.actions.setNextQueue(action.payload.world.nextQueue)
    );
  },
});
