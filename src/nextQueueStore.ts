import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { TaskQueue, TaskId } from "./engine";
import { saveLoaded } from "./save";

/**
 * This slice manages the task queue/schedule that the user is currently editing
 * (i.e., the one that will be active on the next iteration of the loop).
 */
export const nextQueueSlice = createSlice({
  name: "nextQueue",
  initialState: [] as TaskQueue,
  reducers: {
    /**
     * Push a task to the end of the queue. If the last task in the queue is the
     * given kind, increments its count by 1 instead.
     */
    pushTaskToQueue: (state, action: PayloadAction<TaskId>) => {
      const id = action.payload;
      const len = state.length;
      if (len !== 0 && state[len - 1].task === action.payload) {
        state[state.length - 1].count++;
      } else {
        state.push({ task: id, count: 1 });
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
      checkBounds(state, index);
      const entry = state[index];
      entry.count += amount;
      if (entry.count <= 0) {
        state.splice(index, 1);
      }
    },

    /** Set the batch count to a fixed number. */
    setBatchCount: (
      state,
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      const { index, amount } = action.payload;
      checkBounds(state, index);
      const entry = state[index];
      entry.count = amount;
      if (entry.count <= 0) {
        state.splice(index, 1);
      }
    },

    /**
     * Move the task at `from` to the position `to`. Throws if either of those
     * is out of bounds.
     */
    moveTask: (state, action: PayloadAction<{ from: number; to: number }>) => {
      const { from, to } = action.payload;
      checkBounds(state, from);
      checkBounds(state, to);
      // Yes, this works no matter what `from` and `to` are. Unit test it anyway
      // though.
      const entry = state[from];
      state.splice(from, 1);
      state.splice(to, 0, entry);
    },

    /** Removes a task entirely from the state. */
    removeTask: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      checkBounds(state, index);
      state.splice(index, 1);
    },
  },

  extraReducers(builder) {
    builder.addCase(saveLoaded, (_state, action) => {
      return action.payload.world.nextQueue;
    });
  },
});

export const {
  pushTaskToQueue,
  modifyBatchCount,
  setBatchCount,
  moveTask,
  removeTask,
} = nextQueueSlice.actions;

function checkBounds(queue: TaskQueue, index: number) {
  if (index < 0 || index >= queue.length) {
    throw new Error(`Invalid index ${index} for queue ${queue}`);
  }
}
