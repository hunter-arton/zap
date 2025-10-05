// src/commands/devCommands.ts
import { core } from "@tauri-apps/api";
import type { ActiveSessionInfo, DevStats, DevBoxInfo } from "../types";

export const devCommands = {
    async createSession(sessionName: string, boxId: string): Promise<void> {
        return await core.invoke("create_session", {
            sessionName,
            boxId
        });
    },

    async getAllSessions(): Promise<ActiveSessionInfo[]> {
        return await core.invoke("get_all_sessions");
    },

    async getSessionInfo(sessionName: string): Promise<ActiveSessionInfo | null> {
        return await core.invoke("get_dev_session_info", {
            sessionName
        });
    },

    async stopSession(sessionName: string): Promise<void> {
        return await core.invoke("stop_session", {
            sessionName
        });
    },

    async clearAllSessions(): Promise<void> {
        return await core.invoke("clear_all_sessions");
    },

    async hasAnySessions(): Promise<boolean> {
        return await core.invoke("has_any_sessions");
    },

    async getAvailableDevBoxes(): Promise<DevBoxInfo[]> {
        return await core.invoke("get_available_dev_boxes");
    },

    async getDevStats(): Promise<DevStats> {
        return await core.invoke("get_dev_stats");
    },

    async validateSessionName(sessionName: string): Promise<boolean> {
        try {
            const result: boolean = await core.invoke("validate_session_name", {
                sessionName
            });
            console.log(`🔍 Backend availability check for "${sessionName}":`, result);
            return result;
        } catch (error) {
            console.error(`❌ Session name validation error for "${sessionName}":`, error);
            return false;
        }
    },

    async validateSessionKey(sessionKeyHex: string): Promise<boolean> {
        return await core.invoke("validate_session_key", {
            sessionKeyHex
        });
    },
};

// Session helpers remain the same
export const sessionHelpers = {
    validateSessionNameLocally(sessionName: string): { isValid: boolean; message?: string } {
        if (!sessionName || sessionName.trim().length === 0) {
            return { isValid: false, message: "Session name cannot be empty" };
        }

        if (sessionName.length > 30) {
            return { isValid: false, message: "Session name cannot exceed 30 characters" };
        }

        const pattern = /^[a-z0-9\-]{1,30}$/;
        if (!pattern.test(sessionName)) {
            return {
                isValid: false,
                message: "Session name must be 1-30 characters, lowercase letters, numbers, and hyphens only"
            };
        }

        return { isValid: true };
    },

    generateSessionName(boxName: string, attempt: number = 0): string {
        let baseName = boxName
            .toLowerCase()
            .replace(/[^a-z0-9\-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, attempt > 0 ? 25 : 30);

        if (attempt > 0) {
            const suffix = `-${attempt}`;
            baseName = baseName.substring(0, 30 - suffix.length) + suffix;
        }

        return baseName || 'dev-session';
    }
};