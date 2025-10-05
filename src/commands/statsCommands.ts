// src/commands/statsCommands.ts 
import { core } from "@tauri-apps/api";
import type { VaultStats } from "../types";

export const statsCommands = {
    async getVaultStats(): Promise<VaultStats> {
        return await core.invoke("get_vault_stats");
    },
};
