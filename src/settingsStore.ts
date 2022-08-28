import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Settings = {
  /** Whether to automatically restart the loop when it finishes. */
  autoRestart: boolean;
  /**
   * Whether or not to auto restart if the loop failed. Only has an effect if
   * autoRestart is true.
   */
  autoRestartOnFailure: boolean;
  /**
   * If true, then we tick the time at 1000 times the normal rate. This also
   * disables both autorestart settings.
   */
  speedrunMode: boolean;
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState: (): Settings => ({
    autoRestart: true,
    autoRestartOnFailure: false,
    speedrunMode: false,
  }),
  reducers: {
    setAutoRestart: (state, action: PayloadAction<boolean>) => {
      state.autoRestart = action.payload;
    },
    setAutoRestartOnFailure: (state, action: PayloadAction<boolean>) => {
      state.autoRestartOnFailure = action.payload;
    },
    setSpeedrunMode: (state, action: PayloadAction<boolean>) => {
      state.speedrunMode = action.payload;
    },
  },
});

export const { setAutoRestart, setAutoRestartOnFailure, setSpeedrunMode } =
  settingsSlice.actions;
