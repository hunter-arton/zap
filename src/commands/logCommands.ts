// src/commands/logCommands.ts
import { core } from "@tauri-apps/api";
import type { LogEntry } from "../types";

export const logCommands = {
    async getAllLogs(): Promise<LogEntry[]> {
        return await core.invoke("get_all_logs");
    },

    async clearAllLogs(password: string): Promise<number> {
        return await core.invoke("clear_all_logs", { password });
    },

    async exportLogs(): Promise<string> {
        return await core.invoke("export_logs");
    },
};
