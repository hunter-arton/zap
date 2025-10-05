// src/commands/importExportCommands.ts
import { core } from "@tauri-apps/api";
import type { ImportResult } from "../types";

export const importExportCommands = {
    async exportVault(): Promise<string> {
        return await core.invoke("export_vault");
    },

    async exportBoxAsEnv(
        boxId: string,
        prefix: string | null
    ): Promise<string> {
        return await core.invoke("export_box_as_env", { boxId, prefix });
    },

    async importVault(jsonData: string): Promise<ImportResult> {
        return await core.invoke("import_vault", { jsonData });
    },

    async importEnvToBox(
        envContent: string,
        targetBoxId: string
    ): Promise<ImportResult> {
        return await core.invoke("import_env_to_box", { envContent, targetBoxId });
    },
};