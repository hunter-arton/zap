//src/commands/authCommands.ts
import { core } from "@tauri-apps/api";
import type { SessionInfo } from "../types";

export const authCommands = {
    async initializeApp(): Promise<boolean> {
        return await core.invoke("initialize_app");
    },

    async unlockVault(password: string): Promise<boolean> {
        return await core.invoke("unlock_vault", { password });
    },

    async lockVault(): Promise<void> {
        return await core.invoke("lock_vault");
    },

    async isVaultLocked(): Promise<boolean> {
        return await core.invoke("is_vault_locked");
    },

    async verifyMasterPassword(password: string): Promise<void> {
        return await core.invoke("verify_master_password", { password });
    },

    async getSessionInfo(): Promise<SessionInfo> {
        return await core.invoke("get_session_info");
    },
};