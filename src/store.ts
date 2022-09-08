import { AnyAction, configureStore, ThunkAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { worldSlice } from "./worldStore";
import { extra } from "./extra";
import { listener } from "./listener";
import { settingsSlice } from "./settingsStore";
import { EngineView } from "./viewModel";
import { nextQueueSlice } from "./nextQueueStore";

export const store = configureStore({
  reducer: {
    world: worldSlice.reducer,
    settings: settingsSlice.reducer,
    nextQueue: nextQueueSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: {
        extraArgument: extra,
      },
    }).prepend(listener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export type AppThunkAction<T = void> = ThunkAction<
  T,
  RootState,
  typeof extra,
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
