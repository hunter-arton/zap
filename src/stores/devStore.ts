//src/stores/devStore.ts
import { create } from "zustand";
import { devCommands, sessionHelpers } from "../commands";
import { getErrorMessage } from "../utils";
import type { ActiveSessionInfo, DevStats, DevBoxInfo } from "../types";

interface DevState {
    sessions: ActiveSessionInfo[];
    availableDevBoxes: DevBoxInfo[];
    devStats: DevStats | null;
    isLoading: boolean;
    error: string | null;
    totalSessions: number;
    hasAnySessions: boolean;
}

interface DevActions {
    createSession: (sessionName: string, boxId: string) => Promise<void>;
    stopSession: (sessionName: string) => Promise<void>;
    clearAllSessions: () => Promise<void>;
    loadAllSessions: () => Promise<void>;
    loadAvailableDevBoxes: () => Promise<void>;
    loadDevStats: () => Promise<void>;
    refreshAll: () => Promise<void>;
    getSessionInfo: (sessionName: string) => Promise<ActiveSessionInfo | null>;
    findSessionByName: (sessionName: string) => ActiveSessionInfo | null;
    validateSessionName: (sessionName: string) => Promise<boolean>;
    validateSessionKey: (sessionKeyHex: string) => Promise<boolean>;
    validateSessionNameLocally: (sessionName: string) => { isValid: boolean; message?: string };
    clearError: () => void;
    reset: () => void;
}

type DevStore = DevState & DevActions;

const initialState: DevState = {
    sessions: [],
    availableDevBoxes: [],
    devStats: null,
    isLoading: false,
    error: null,
    totalSessions: 0,
    hasAnySessions: false,
};

export const useDevStore = create<DevStore>((set, get) => ({
    ...initialState,

    createSession: async (sessionName: string, boxId: string) => {
        set({ isLoading: true, error: null });

        try {
            const validation = sessionHelpers.validateSessionNameLocally(sessionName);
            if (!validation.isValid) {
                throw new Error(validation.message);
            }

            await devCommands.createSession(sessionName, boxId);
            await get().refreshAll();
            set({ isLoading: false });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    stopSession: async (sessionName: string) => {
        set({ isLoading: true, error: null });

        try {
            await devCommands.stopSession(sessionName);
            await get().refreshAll();
            set({ isLoading: false });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    clearAllSessions: async () => {
        set({ isLoading: true, error: null });

        try {
            await devCommands.clearAllSessions();
            set({
                sessions: [],
                totalSessions: 0,
                hasAnySessions: false,
                isLoading: false
            });
            await get().loadDevStats();
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    loadAllSessions: async () => {
        try {
            const sessions = await devCommands.getAllSessions();
            const totalSessions = sessions.length;
            const hasAnySessions = totalSessions > 0;

            set({
                sessions,
                totalSessions,
                hasAnySessions,
                error: null
            });
        } catch (error) {
            set({
                sessions: [],
                totalSessions: 0,
                hasAnySessions: false,
                error: getErrorMessage(error)
            });
        }
    },

    loadAvailableDevBoxes: async () => {
        try {
            const availableDevBoxes = await devCommands.getAvailableDevBoxes();
            set({ availableDevBoxes, error: null });
        } catch (error) {
            set({
                availableDevBoxes: [],
                error: getErrorMessage(error)
            });
        }
    },

    loadDevStats: async () => {
        try {
            const devStats = await devCommands.getDevStats();
            set({ devStats, error: null });
        } catch (error) {
            set({
                devStats: null,
                error: getErrorMessage(error)
            });
        }
    },

    refreshAll: async () => {
        set({ isLoading: true });

        try {
            await Promise.all([
                get().loadAllSessions(),
                get().loadAvailableDevBoxes(),
                get().loadDevStats()
            ]);
        } finally {
            set({ isLoading: false });
        }
    },

    getSessionInfo: async (sessionName: string) => {
        try {
            return await devCommands.getSessionInfo(sessionName);
        } catch (error) {
            console.error(`Failed to get session info for ${sessionName}:`, error);
            return null;
        }
    },

    findSessionByName: (sessionName: string) => {
        const { sessions } = get();
        return sessions.find(session => session.session_name === sessionName) || null;
    },

    validateSessionName: async (sessionName: string) => {
        try {
            return await devCommands.validateSessionName(sessionName);
        } catch (error) {
            return false;
        }
    },

    validateSessionKey: async (sessionKeyHex: string) => {
        try {
            return await devCommands.validateSessionKey(sessionKeyHex);
        } catch (error) {
            return false;
        }
    },

    validateSessionNameLocally: (sessionName: string) => {
        return sessionHelpers.validateSessionNameLocally(sessionName);
    },

    clearError: () => set({ error: null }),
    reset: () => set(initialState),
}));
