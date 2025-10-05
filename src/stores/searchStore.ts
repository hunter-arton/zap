// src/stores/searchStore.ts

import { create } from "zustand";
import { boxCommands, secretCommands } from "../commands";
import { getErrorMessage } from "../utils";
import type { Box, Secret } from "../types";

interface SearchState {
    // Results
    boxResults: Box[] | null;
    secretResults: Secret[] | null;

    // Query state
    activeQuery: string;
    activeBoxId: string | null; // For secret search within box

    isLoading: boolean;
    error: string | null;
}

interface SearchActions {
    searchBoxes: (query: string, tags: string[]) => Promise<void>;
    searchSecretsInBox: (boxId: string, query: string) => Promise<void>;
    clearSearch: () => void;
    clearError: () => void;
    reset: () => void;
}

type SearchStore = SearchState & SearchActions;

const initialState: SearchState = {
    boxResults: null,
    secretResults: null,
    activeQuery: "",
    activeBoxId: null,
    isLoading: false,
    error: null,
};

export const useSearchStore = create<SearchStore>((set) => ({
    ...initialState,

    searchBoxes: async (query: string, tags: string[]) => {
        set({ isLoading: true, error: null, activeQuery: query, activeBoxId: null });
        try {
            const boxResults = await boxCommands.searchBoxesGlobal(query, tags);
            set({
                boxResults,
                secretResults: null, // Clear secret results when searching boxes
                isLoading: false
            });
        } catch (error) {
            set({
                error: getErrorMessage(error),
                isLoading: false
            });
        }
    },

    searchSecretsInBox: async (boxId: string, query: string) => {
        set({ isLoading: true, error: null, activeQuery: query, activeBoxId: boxId });
        try {
            const secretResults = await secretCommands.searchSecretsInBox(boxId, query);
            set({
                secretResults,
                boxResults: null, // Clear box results when searching secrets
                isLoading: false
            });
        } catch (error) {
            set({
                error: getErrorMessage(error),
                isLoading: false
            });
        }
    },

    clearSearch: () => set({
        boxResults: null,
        secretResults: null,
        activeQuery: "",
        activeBoxId: null
    }),

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));