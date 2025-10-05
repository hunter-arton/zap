// src/stores/boxStore.ts
import { create } from "zustand";
import { boxCommands, statsCommands } from "../commands";
import { getErrorMessage } from "../utils";
import type { Box, BoxFormData, VaultStats } from "../types";

interface BoxState {
    boxes: Box[];
    stats: VaultStats | null;
    isLoading: boolean;
    error: string | null;
}

interface BoxActions {
    loadBoxes: () => Promise<void>;
    createBox: (data: BoxFormData) => Promise<string>;
    updateBox: (boxId: string, data: Partial<BoxFormData>) => Promise<void>;
    deleteBox: (boxId: string) => Promise<void>;
    clearError: () => void;
    reset: () => void;
}

type BoxStore = BoxState & BoxActions;

const initialState: BoxState = {
    boxes: [],
    stats: null,
    isLoading: false,
    error: null,
};

export const useBoxStore = create<BoxStore>((set) => ({
    ...initialState,

    loadBoxes: async () => {
        set({ isLoading: true, error: null });
        try {
            const [boxes, stats] = await Promise.all([
                boxCommands.getAllBoxes(),
                statsCommands.getVaultStats(),
            ]);
            set({ boxes, stats, isLoading: false });
        } catch (error) {
            set({ error: getErrorMessage(error), isLoading: false });
        }
    },

    createBox: async (data: BoxFormData) => {
        set({ isLoading: true, error: null });
        try {
            const boxId = await boxCommands.createBox(
                data.name,
                data.description || null,
                data.tags,
                data.dev_mode
            );
            const [boxes, stats] = await Promise.all([
                boxCommands.getAllBoxes(),
                statsCommands.getVaultStats(),
            ]);
            set({ boxes, stats, isLoading: false });
            return boxId;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    updateBox: async (boxId: string, data: Partial<BoxFormData>) => {
        set({ isLoading: true, error: null });
        try {
            await boxCommands.updateBox(
                boxId,
                data.name || null,
                data.description !== undefined ? data.description || null : null,
                data.tags || null,
                data.dev_mode !== undefined ? data.dev_mode : null
            );

            const [boxes, stats] = await Promise.all([
                boxCommands.getAllBoxes(),
                statsCommands.getVaultStats(),
            ]);
            set({ boxes, stats, isLoading: false });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    deleteBox: async (boxId: string) => {
        set({ isLoading: true, error: null });
        try {
            await boxCommands.deleteBox(boxId);

            const [boxes, stats] = await Promise.all([
                boxCommands.getAllBoxes(),
                statsCommands.getVaultStats(),
            ]);

            set({ boxes, stats, isLoading: false });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}));
