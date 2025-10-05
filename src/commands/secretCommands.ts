// src/commands/secretCommands.ts
import { core } from "@tauri-apps/api";
import type { Secret } from "../types";

export const secretCommands = {
    async getAllSecrets(): Promise<Secret[]> {
        return await core.invoke("get_all_secrets");
    },

    async getSecretsByBoxId(boxId: string): Promise<Secret[]> {
        return await core.invoke("get_secrets_by_box_id", { boxId });
    },

    async createSecret(
        boxId: string,
        name: string,
        value: string
    ): Promise<string> {
        return await core.invoke("create_secret", {
            boxId,
            name,
            value
        });
    },

    async updateSecret(
        secretId: string,
        name: string | null,
        value: string | null
    ): Promise<void> {
        return await core.invoke("update_secret", {
            secretId,
            name,
            value
        });
    },

    async deleteSecret(secretId: string): Promise<void> {
        return await core.invoke("delete_secret", { secretId });
    },

    async deleteSelectedSecrets(secretIds: string[]): Promise<string[]> {
        return await core.invoke("delete_selected_secrets", { secretIds });
    },

    async copySecretsToBox(
        secretIds: string[],
        targetBoxId: string
    ): Promise<string[]> {
        return await core.invoke("copy_secrets_to_box", {
            secretIds,
            targetBoxId
        });
    },

    async revealSecretValue(secretId: string): Promise<string> {
        return await core.invoke("reveal_secret_value", { secretId });
    },

    async searchSecretsInBox(boxId: string, query: string): Promise<Secret[]> {
        return await core.invoke("search_secrets_in_box", { boxId, query });
    },
};