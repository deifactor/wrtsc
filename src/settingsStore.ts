import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { saveLoaded } from "./save";

export type Settings = {
  /** Whether to automatically restart the loop when it finishes. */
  autoRestart: boolean;
  /**
   * Whether or not to auto restart if the loop failed. Only has an effect if
   * autoRestart is true.
   */
  pauseOnFailure: boolean;
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
    pauseOnFailure: true,
    speedrunMode: false,
  }),
  reducers: {
    setAutoRestart: (state, action: PayloadAction<boolean>) => {
      state.autoRestart = action.payload;
    },
    setPauseOnFailure: (state, action: PayloadAction<boolean>) => {
      state.pauseOnFailure = action.payload;
    },
    setSpeedrunMode: (state, action: PayloadAction<boolean>) => {
      state.speedrunMode = action.payload;
    },
  },

  extraReducers(builder) {
    builder.addCase(saveLoaded, (_state, action) => {
      return action.payload.settings;
    });
  },
});

export const { setAutoRestart, setPauseOnFailure, setSpeedrunMode } =
  settingsSlice.actions;
