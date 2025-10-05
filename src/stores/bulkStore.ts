// src/stores/bulkStore.ts
import { create } from "zustand";
import { boxCommands, secretCommands } from "../commands";
import { getErrorMessage } from "../utils";
const { useBoxStore } = await import('./boxStore');
const { useSecretStore } = await import('./secretStore');

interface BulkState {
    selectedBoxIds: Set<string>;
    selectedSecretIds: Set<string>;
    isLoading: boolean;
    error: string | null;
}

interface BulkActions {
    toggleBoxSelection: (boxId: string) => void;
    toggleSecretSelection: (secretId: string) => void;
    selectAllBoxes: (boxIds: string[]) => void;
    selectAllSecrets: (secretIds: string[]) => void;
    clearBoxSelection: () => void;
    clearSecretSelection: () => void;
    clearAllSelections: () => void;
    getSelectedBoxIds: () => string[];
    getSelectedSecretIds: () => string[];
    hasBoxSelections: () => boolean;
    hasSecretSelections: () => boolean;

    deleteSelectedBoxes: (boxIds: string[]) => Promise<string[]>;
    deleteSelectedSecrets: (secretIds: string[], sourceBoxId: string) => Promise<string[]>;
    copySecretsToBox: (secretIds: string[], sourceBoxId: string, targetBoxId: string) => Promise<string[]>;

    clearError: () => void;
    reset: () => void;
}

type BulkStore = BulkState & BulkActions;

const initialState: BulkState = {
    selectedBoxIds: new Set(),
    selectedSecretIds: new Set(),
    isLoading: false,
    error: null,
};

export const useBulkStore = create<BulkStore>((set, get) => ({
    ...initialState,

    toggleBoxSelection: (boxId: string) => {
        const { selectedBoxIds } = get();
        const newSelected = new Set(selectedBoxIds);
        if (newSelected.has(boxId)) {
            newSelected.delete(boxId);
        } else {
            newSelected.add(boxId);
        }
        set({ selectedBoxIds: newSelected });
    },

    toggleSecretSelection: (secretId: string) => {
        const { selectedSecretIds } = get();
        const newSelected = new Set(selectedSecretIds);
        if (newSelected.has(secretId)) {
            newSelected.delete(secretId);
        } else {
            newSelected.add(secretId);
        }
        set({ selectedSecretIds: newSelected });
    },

    selectAllBoxes: (boxIds: string[]) => {
        set({ selectedBoxIds: new Set(boxIds) });
    },

    selectAllSecrets: (secretIds: string[]) => {
        set({ selectedSecretIds: new Set(secretIds) });
    },

    clearBoxSelection: () => set({ selectedBoxIds: new Set() }),
    clearSecretSelection: () => set({ selectedSecretIds: new Set() }),
    clearAllSelections: () => set({
        selectedBoxIds: new Set(),
        selectedSecretIds: new Set()
    }),

    getSelectedBoxIds: () => Array.from(get().selectedBoxIds),
    getSelectedSecretIds: () => Array.from(get().selectedSecretIds),
    hasBoxSelections: () => get().selectedBoxIds.size > 0,
    hasSecretSelections: () => get().selectedSecretIds.size > 0,

    deleteSelectedBoxes: async (boxIds: string[]) => {
        set({ isLoading: true, error: null });

        try {
            const deletedIds = await boxCommands.deleteSelectedBoxes(boxIds);

            const { selectedBoxIds } = get();
            const newSelected = new Set(selectedBoxIds);
            deletedIds.forEach(id => newSelected.delete(id));

            set({ selectedBoxIds: newSelected, isLoading: false });


            await Promise.all([
                useBoxStore.getState().loadBoxes(),
                useSecretStore.getState().loadAllSecrets()
            ]);

            return deletedIds;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    deleteSelectedSecrets: async (secretIds: string[], sourceBoxId: string) => {
        set({ isLoading: true, error: null });

        try {
            const deletedIds = await secretCommands.deleteSelectedSecrets(secretIds);

            const { selectedSecretIds } = get();
            const newSelected = new Set(selectedSecretIds);
            deletedIds.forEach(id => newSelected.delete(id));

            set({ selectedSecretIds: newSelected, isLoading: false });
            await Promise.all([
                useBoxStore.getState().loadBoxes(),
                useSecretStore.getState().loadAllSecrets(),
                useSecretStore.getState().loadSecretsByBox(sourceBoxId)
            ]);

            return deletedIds;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    copySecretsToBox: async (secretIds: string[], sourceBoxId: string, targetBoxId: string) => {
        set({ isLoading: true, error: null });

        try {
            const copiedIds = await secretCommands.copySecretsToBox(secretIds, targetBoxId);

            set({ isLoading: false });
            await Promise.all([
                useBoxStore.getState().loadBoxes(),
                useSecretStore.getState().loadAllSecrets(),
                useSecretStore.getState().loadSecretsByBox(sourceBoxId),
                useSecretStore.getState().loadSecretsByBox(targetBoxId)
            ]);

            return copiedIds;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    clearError: () => set({ error: null }),
    reset: () => set({ ...initialState, selectedBoxIds: new Set(), selectedSecretIds: new Set() }),
}));