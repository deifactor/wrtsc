import {
  AnyAction,
  combineReducers,
  configureStore,
  ThunkAction,
} from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { worldSlice } from "./worldStore";
import { listener } from "./listener";
import { settingsSlice } from "./settingsStore";
import { EngineView } from "./viewModel";
import { nextQueueSlice } from "./nextQueueStore";
import { Engine, QueueEngine } from "./engine";
import { QueueSchedule } from "./engine/schedule";

const rootReducer = combineReducers({
  world: worldSlice.reducer,
  settings: settingsSlice.reducer,
  nextQueue: nextQueueSlice.reducer,
});

/**
 * Create a store as initialized from scratch. This returns the engine for
 * convenience in tests.
 */
export function createStore(
  engine: QueueEngine = new Engine(new QueueSchedule([]))
) {
  return {
    store: configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          thunk: {
            extraArgument: { engine },
          },
        }).prepend(listener.middleware),
    }),
    engine,
  };
}

export const { store } = createStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunkAction<T = void> = ThunkAction<
  T,
  RootState,
  { engine: QueueEngine },
  AnyAction
>;
export function useEngineSelector<T>(selector: (view: EngineView) => T): T {
  return useSelector<RootState, T>(
    (store) => selector(store.world.view),
    equal
  );
}
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
