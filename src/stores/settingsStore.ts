// src/stores/settingsStore.ts

import { create } from "zustand";
import { settingsCommands } from "../commands";
import { getErrorMessage } from "../utils";
import type { Settings } from "../types";

interface SettingsState {
    settings: Settings | null;
    isLoading: boolean;
    error: string | null;
}

interface SettingsActions {
    loadSettings: () => Promise<void>;
    updateSettings: (settings: Settings) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

type SettingsStore = SettingsState & SettingsActions;

const initialState: SettingsState = {
    settings: null,
    isLoading: false,
    error: null,
};

export const useSettingsStore = create<SettingsStore>((set) => ({
    ...initialState,

    loadSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const settings = await settingsCommands.getSettings();
            set({ settings, isLoading: false });
        } catch (error) {
            set({
                error: getErrorMessage(error),
                isLoading: false,
            });
        }
    },

    updateSettings: async (settings: Settings) => {
        set({ isLoading: true, error: null });
        try {
            await settingsCommands.updateSettings(settings);
            set({ settings, isLoading: false });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));