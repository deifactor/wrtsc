import { configureStore, createSlice, PayloadAction } from "@reduxjs/toolkit";
import equal from "fast-deep-equal";
import { useDispatch, useSelector } from "react-redux";
import { Engine } from "./engine";
import { EngineView, project } from "./viewModel";

export const engineSlice = createSlice({
  name: "engine",
  initialState: project(new Engine()),
  reducers: {
    update: (_state, action: PayloadAction<EngineView>) => {
      return action.payload;
    },
  },
});

export const { update } = engineSlice.actions;

export const store = configureStore({
  reducer: {
    engine: engineSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export function useEngineSelector<T>(selector: (engine: EngineView) => T): T {
  return useSelector<RootState, T>((store) => selector(store.engine), equal);
}
export const useAppDispatch: () => AppDispatch = useDispatch;
