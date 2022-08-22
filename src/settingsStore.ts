import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type Settings = {
  /** Whether to automatically restart the loop when it finishes. */
  autoRestart: boolean;
  /**
   * Whether or not to auto restart if the loop failed. Only has an effect if
   * autoRestart is true.
   */
  autoRestartOnFailure: boolean;
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState: (): Settings => ({
    autoRestart: true,
    autoRestartOnFailure: false,
  }),
  reducers: {
    setAutoRestart: (state, action: PayloadAction<boolean>) => {
      state.autoRestart = action.payload;
    },
    setAutoRestartOnFailure: (state, action: PayloadAction<boolean>) => {
      state.autoRestartOnFailure = action.payload;
    },
  },
});

export const { setAutoRestart, setAutoRestartOnFailure } =
  settingsSlice.actions;
