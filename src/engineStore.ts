import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { Engine, TaskQueue } from "./engine";
import { EngineView, project } from "./viewModel";

export type Settings = {
  autoRestart: boolean;
};

export const engineSlice = createSlice({
  name: "engine",
  initialState: () => ({
    engine: Engine.loadFromStorage(),

    settings: { autoRestart: true },
    lastUpdate: new Date().getTime(),
  }),
  reducers: {
    hardReset: () => {
      return {
        engine: new Engine(),
        settings: { autoRestart: true },
        lastUpdate: new Date().getTime(),
      };
    },
    startLoop: (state, action: PayloadAction<TaskQueue>) => {
      state.engine.startLoop(action.payload);
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
        state.engine.startLoop(state.engine.schedule.queue);
      }
      state.lastUpdate = now;
      state.engine.saveToStorage();
    },
  },
});

export const { hardReset, startLoop, tick, nextTask } = engineSlice.actions;

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
export function useEngineSelector<T>(selector: (engine: EngineView) => T): T {
  return useSelector<RootState, T>(
    (store) => selector(project(store.engine.engine)),
    equal
  );
}
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
