import {
  createListenerMiddleware,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { AppDispatch, RootState } from "./store";

export const listener = createListenerMiddleware();

export type AppStartListening = TypedStartListening<
  RootState,
  AppDispatch,
  void
>;
export const startAppListening = listener.startListening as AppStartListening;
