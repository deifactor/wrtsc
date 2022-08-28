import { AnyAction, configureStore, ThunkAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import { engineSlice } from "./engineStore";
import { extra } from "./extra";
import { listener } from "./listener";
import { settingsSlice } from "./settingsStore";
import { EngineView } from "./viewModel";

export const store = configureStore({
  reducer: {
    engine: engineSlice.reducer,
    settings: settingsSlice.reducer,
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
export type AppThunkAction = ThunkAction<
  void,
  RootState,
  typeof extra,
  AnyAction
>;
export function useEngineSelector<T>(selector: (view: EngineView) => T): T {
  return useSelector<RootState, T>(
    (store) => selector(store.engine.view),
    equal
  );
}
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
