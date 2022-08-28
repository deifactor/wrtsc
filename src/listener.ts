import {
  createListenerMiddleware,
  TypedStartListening,
} from "@reduxjs/toolkit";
import { extra } from "./extra";
import { AppDispatch, RootState } from "./store";

export const listener = createListenerMiddleware({ extra });

export type AppStartListening = TypedStartListening<
  RootState,
  AppDispatch,
  typeof extra
>;
export const startAppListening = listener.startListening as AppStartListening;
