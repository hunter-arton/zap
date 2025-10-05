// src/commands/settingsCommands.ts 
import { core } from "@tauri-apps/api";
import type { Settings } from "../types";

export const settingsCommands = {
    async getSettings(): Promise<Settings> {
        return await core.invoke("get_settings");
    },

    async updateSettings(newSettings: Settings): Promise<void> {
        return await core.invoke("update_settings", {
            newSettings
        });
    },
};