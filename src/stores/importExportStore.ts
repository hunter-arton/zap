// src/stores/importExportStore.ts 
import { create } from "zustand";
import { importExportCommands } from "../commands";
import { getErrorMessage } from "../utils";
import type { ImportResult } from "../types";

interface ImportExportState {
    isLoading: boolean;
    error: string | null;
}

interface ImportExportActions {
    exportVault: () => Promise<string>;
    exportBoxAsEnv: (boxId: string, prefix?: string) => Promise<string>;
    importVault: (jsonData: string) => Promise<ImportResult>;
    importEnvToBox: (envContent: string, targetBoxId: string) => Promise<ImportResult>;
    clearError: () => void;
    reset: () => void;
}

type ImportExportStore = ImportExportState & ImportExportActions;

const initialState: ImportExportState = {
    isLoading: false,
    error: null,
};

export const useImportExportStore = create<ImportExportStore>((set) => ({
    ...initialState,

    exportVault: async () => {
        set({ isLoading: true, error: null });
        try {
            const exportData = await importExportCommands.exportVault();
            set({ isLoading: false });
            return exportData;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    exportBoxAsEnv: async (boxId: string, prefix?: string) => {
        set({ isLoading: true, error: null });
        try {
            const envData = await importExportCommands.exportBoxAsEnv(boxId, prefix || null);
            set({ isLoading: false });
            return envData;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    importVault: async (jsonData: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await importExportCommands.importVault(jsonData);
            set({ isLoading: false });
            return result;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    importEnvToBox: async (envContent: string, targetBoxId: string) => {
        set({ isLoading: true, error: null });
        try {
            const result = await importExportCommands.importEnvToBox(envContent, targetBoxId);
            set({ isLoading: false });
            return result;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}));