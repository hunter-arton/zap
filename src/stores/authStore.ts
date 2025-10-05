// src/stores/authStore.ts

import { create } from "zustand";
import { authCommands, settingsCommands } from "../commands";
import { validatePassword, getErrorMessage } from "../utils";
import type { Settings, SessionInfo } from "../types";

interface AuthState {
    isUnlocked: boolean;
    isFirstTime: boolean;
    sessionInfo: SessionInfo | null;
    sessionTimeoutMinutes: number;

    frontendTimeLeft: number;
    lastBackendSync: number;

    isLoading: boolean;
    error: string | null;
    mode: "first-time" | "login";
}

interface AuthActions {
    initialize: () => Promise<void>;
    unlock: (password: string, confirmPassword?: string) => Promise<void>;
    lock: () => Promise<void>;
    refreshSessionInfo: () => Promise<void>;
    updateSessionTimeout: (minutes: number) => Promise<void>;

    // Frontend timer actions
    decrementFrontendTimer: () => void;
    syncWithBackend: (backendTimeLeft: number) => void;

    clearError: () => void;
    reset: () => void;
}

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
    isUnlocked: false,
    isFirstTime: false,
    sessionInfo: null,
    sessionTimeoutMinutes: 5,
    frontendTimeLeft: 0,
    lastBackendSync: 0,
    isLoading: false,
    error: null,
    mode: "login",
};

export const useAuthStore = create<AuthStore>((set, get) => ({
    ...initialState,

    initialize: async () => {
        set({ isLoading: true, error: null });
        try {
            const isFirstTime = await authCommands.initializeApp();

            set({
                isFirstTime,
                mode: isFirstTime ? "first-time" : "login",
                isLoading: false,
            });
        } catch (error) {
            set({
                error: getErrorMessage(error),
                isLoading: false,
            });
        }
    },

    unlock: async (password: string, confirmPassword?: string) => {
        const { mode } = get();
        set({ isLoading: true, error: null });

        try {
            if (!password.trim()) {
                throw new Error("Password cannot be empty");
            }

            if (mode === "first-time") {
                if (!confirmPassword) {
                    throw new Error("Please confirm your password");
                }
                if (password !== confirmPassword) {
                    throw new Error("Passwords do not match");
                }

                const validation = validatePassword(password);
                if (!validation.isValid) {
                    throw new Error(validation.message);
                }
            }

            // Unlock the vault
            await authCommands.unlockVault(password);

            // Load user timeout preference
            let sessionTimeoutMinutes = 5;
            if (mode === "login") {
                try {
                    const settings = await settingsCommands.getSettings();
                    sessionTimeoutMinutes = Math.min(Math.max(settings.password_timeout_minutes, 5), 60);
                } catch (error) {
                    sessionTimeoutMinutes = 5;
                }
            }

            // Get session info from backend
            const sessionInfo = await authCommands.getSessionInfo();

            set({
                isUnlocked: true,
                isFirstTime: false,
                mode: "login",
                sessionInfo,
                sessionTimeoutMinutes,
                frontendTimeLeft: sessionInfo.time_left_seconds,
                lastBackendSync: Date.now(),
                isLoading: false,
                error: null,
            });
        } catch (error) {
            set({
                error: getErrorMessage(error),
                isLoading: false,
            });
            throw error;
        }
    },

    lock: async () => {
        try {
            await authCommands.lockVault();
            set({
                isUnlocked: false,
                sessionInfo: null,
                frontendTimeLeft: 0,
                lastBackendSync: 0,
                error: null,
            });
        } catch (error) {
            set({ error: getErrorMessage(error) });
            throw error;
        }
    },

    refreshSessionInfo: async () => {
        const { isUnlocked } = get();
        if (!isUnlocked) return;

        try {
            const sessionInfo = await authCommands.getSessionInfo();

            // If session is locked according to backend, update state
            if (sessionInfo.is_locked) {
                set({
                    isUnlocked: false,
                    sessionInfo: null,
                    frontendTimeLeft: 0,
                    lastBackendSync: 0,
                });
                return;
            }

            // Sync frontend timer with backend
            const { syncWithBackend } = get();
            syncWithBackend(sessionInfo.time_left_seconds);

            set({ sessionInfo });
        } catch (error) {
            // On error, assume session is expired
            set({
                isUnlocked: false,
                sessionInfo: null,
                frontendTimeLeft: 0,
                lastBackendSync: 0,
            });
        }
    },

    updateSessionTimeout: async (minutes: number) => {
        if (minutes < 5 || minutes > 60) {
            throw new Error("Session timeout must be between 5 and 60 minutes");
        }

        try {
            const currentSettings = await settingsCommands.getSettings();
            const updatedSettings: Settings = {
                ...currentSettings,
                password_timeout_minutes: minutes,
            };

            await settingsCommands.updateSettings(updatedSettings);
            set({ sessionTimeoutMinutes: minutes });

            // Wait for backend to process
            await new Promise(resolve => setTimeout(resolve, 300));

            // Get updated session info
            const sessionInfo = await authCommands.getSessionInfo();

            if (!sessionInfo.is_locked) {
                set({
                    sessionInfo,
                    frontendTimeLeft: sessionInfo.time_left_seconds,
                    lastBackendSync: Date.now()
                });
            }
        } catch (error) {
            set({ error: getErrorMessage(error) });
            throw error;
        }
    },

    // Frontend timer management
    decrementFrontendTimer: () => {
        const { frontendTimeLeft, isUnlocked } = get();

        if (!isUnlocked || frontendTimeLeft <= 0) {
            return;
        }

        const newTime = frontendTimeLeft - 1;

        if (newTime <= 0) {
            // Session expired on frontend
            set({
                isUnlocked: false,
                sessionInfo: null,
                frontendTimeLeft: 0,
                lastBackendSync: 0,
            });
        } else {
            set({ frontendTimeLeft: newTime });
        }
    },

    syncWithBackend: (backendTimeLeft: number) => {
        const { frontendTimeLeft, lastBackendSync } = get();
        const now = Date.now();

        // Calculate expected frontend time based on last sync
        const timeSinceSync = Math.floor((now - lastBackendSync) / 1000);
        const expectedFrontendTime = Math.max(0, frontendTimeLeft - timeSinceSync);

        // If difference is more than 2 seconds, sync with backend
        const difference = Math.abs(expectedFrontendTime - backendTimeLeft);

        if (difference > 2) {
            console.log("Syncing timer: frontend =", expectedFrontendTime, "backend =", backendTimeLeft);
            set({
                frontendTimeLeft: backendTimeLeft,
                lastBackendSync: now
            });
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set(initialState),
}));