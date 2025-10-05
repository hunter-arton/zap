// src/stores/logStore.ts
import { create } from "zustand";
import { logCommands } from "../commands";
import { getErrorMessage } from "../utils";
import type { LogEntry, LogFilters } from "../types";

interface LogState {
    logs: LogEntry[];
    filteredLogs: LogEntry[];
    filters: LogFilters;
    isLoading: boolean;
    error: string | null;
}

interface LogActions {
    // Load logs
    loadAllLogs: () => Promise<void>;

    // Filter logs
    setFilters: (filters: Partial<LogFilters>) => void;
    clearFilters: () => void;
    applyFilters: () => void;

    // Export logs
    exportLogs: () => Promise<string>;

    // Clear logs (requires password - only destructive operation)
    clearAllLogs: (password: string) => Promise<number>;


    // Utilities
    clearError: () => void;
    reset: () => void;
}

type LogStore = LogState & LogActions;

const initialState: LogState = {
    logs: [],
    filteredLogs: [],
    filters: {
        actions: [],
        searchQuery: undefined,
        dateRange: undefined,
    },
    isLoading: false,
    error: null,
};

export const useLogStore = create<LogStore>((set, get) => ({
    ...initialState,

    // Load all logs
    loadAllLogs: async () => {
        set({ isLoading: true, error: null });
        try {
            const logs = await logCommands.getAllLogs();
            set({ logs, filteredLogs: logs, isLoading: false });

        } catch (error) {
            set({ error: getErrorMessage(error), isLoading: false });
        }
    },

    // Set filters
    setFilters: (newFilters: Partial<LogFilters>) => {
        const { filters } = get();
        const updatedFilters = { ...filters, ...newFilters };
        set({ filters: updatedFilters });
        get().applyFilters();
    },

    // Clear filters
    clearFilters: () => {
        const defaultFilters: LogFilters = {
            actions: [],
            searchQuery: undefined,
            dateRange: undefined,
        };
        set({ filters: defaultFilters });
        get().applyFilters();
    },

    // Apply current filters to logs
    applyFilters: () => {
        const { logs, filters } = get();
        let filtered = [...logs];

        // Filter by actions
        if (filters.actions.length > 0) {
            filtered = filtered.filter(log => filters.actions.includes(log.action));
        }

        // Filter by search query
        if (filters.searchQuery && filters.searchQuery.trim() !== '') {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(log =>
                log.action.toLowerCase().includes(query) ||
                log.message.toLowerCase().includes(query) ||
                (log.content && log.content.toLowerCase().includes(query))
            );
        }

        // Filter by date range
        if (filters.dateRange) {
            filtered = filtered.filter(log =>
                log.timestamp >= filters.dateRange!.start &&
                log.timestamp <= filters.dateRange!.end
            );
        }

        set({ filteredLogs: filtered });
    },

    // Export logs (no password required)
    exportLogs: async () => {
        set({ isLoading: true, error: null });
        try {
            const exportData = await logCommands.exportLogs();
            set({ isLoading: false });
            return exportData;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    // Clear all logs (ONLY operation that requires password!)
    clearAllLogs: async (password: string) => {
        set({ isLoading: true, error: null });
        try {
            const clearedCount = await logCommands.clearAllLogs(password);

            // Clear state after successful deletion
            set({
                logs: [],
                filteredLogs: [],
                isLoading: false
            });

            return clearedCount;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },
    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));