// src/commands/boxCommands.ts
import { core } from "@tauri-apps/api";
import type { Box } from "../types";

export const boxCommands = {
    async getAllBoxes(): Promise<Box[]> {
        return await core.invoke("get_all_boxes");
    },

    async getBox(boxId: string): Promise<Box> {
        return await core.invoke("get_box", { boxId });
    },

    async createBox(
        name: string,
        description: string | null,
        tags: string[],
        devMode: boolean
    ): Promise<string> {
        return await core.invoke("create_box", {
            name,
            description,
            tags,
            devMode
        });
    },

    async updateBox(
        boxId: string,
        name: string | null,
        description: string | null | undefined,
        tags: string[] | null,
        devMode: boolean | null
    ): Promise<void> {
        return await core.invoke("update_box", {
            boxId,
            name,
            description,
            tags,
            devMode
        });
    },

    async deleteBox(boxId: string): Promise<void> {
        return await core.invoke("delete_box", { boxId });
    },

    async deleteSelectedBoxes(boxIds: string[]): Promise<string[]> {
        return await core.invoke("delete_selected_boxes", { boxIds });
    },

    async searchBoxesGlobal(query: string, tags: string[]): Promise<Box[]> {
        return await core.invoke("search_boxes_global", { query, tags });
    },
};