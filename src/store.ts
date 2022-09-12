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

const rootReducer = combineReducers({
  world: worldSlice.reducer,
  settings: settingsSlice.reducer,
  nextQueue: nextQueueSlice.reducer,
});

/** Create a store as initialized from scratch. */
export function createStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().prepend(listener.middleware),
  });
}

export const store = createStore();

export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;
export type AppThunkAction<T = void> = ThunkAction<
  T,
  RootState,
  void,
  AnyAction
>;
export function useEngineViewSelector<T>(selector: (view: EngineView) => T): T {
  return useSelector<RootState, T>(
    (store) => selector(store.world.view),
    equal
  );
}
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
