import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { loadSave } from "./save";

export type Settings = {
  /** Whether to automatically restart the loop when it finishes. */
  autoRestart: boolean;
  /**
   * Whether or not to auto restart if the loop failed. Only has an effect if
   * autoRestart is true.
   */
  pauseOnFailure: boolean;
  /**
   * If true, shows the cheat mode panel. Note that setting this to false should
   * disable all cheat-type things.
   */
  cheatMode: boolean;
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
    cheatMode: false,
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
    setCheatMode: (state, action: PayloadAction<boolean>) => {
      state.cheatMode = action.payload;
      if (!state.cheatMode) {
        state.speedrunMode = false;
      }
    },
  },

  extraReducers(builder) {
    builder.addCase(loadSave, (_state, action) => {
      return action.payload.settings;
    });
  },
});

export const {
  setAutoRestart,
  setPauseOnFailure,
  setSpeedrunMode,
  setCheatMode,
} = settingsSlice.actions;
