// src/stores/secretsStore.ts
import { create } from "zustand";
import { secretCommands } from "../commands";
import { copyToClipboard, getErrorMessage } from "../utils";
import type { Secret, SecretFormData } from "../types";

interface SecretsState {
    secrets: Secret[];
    boxSecrets: Map<string, Secret[]>;
    isLoading: boolean;
    error: string | null;
}

interface SecretsActions {
    loadAllSecrets: () => Promise<void>;
    loadSecretsByBox: (boxId: string) => Promise<void>;
    createSecret: (boxId: string, data: SecretFormData) => Promise<string>;
    updateSecret: (secretId: string, data: Partial<SecretFormData>) => Promise<void>;
    deleteSecret: (secretId: string) => Promise<void>;

    revealSecretValue: (secretId: string) => Promise<string>;
    copySecret: (secretId: string) => Promise<void>;

    clearError: () => void;
    reset: () => void;
}

type SecretsStore = SecretsState & SecretsActions;

const initialState: SecretsState = {
    secrets: [],
    boxSecrets: new Map(),
    isLoading: false,
    error: null,
};

export const useSecretStore = create<SecretsStore>((set, get) => ({
    ...initialState,

    loadAllSecrets: async () => {
        set({ isLoading: true, error: null });
        try {
            const secrets = await secretCommands.getAllSecrets();
            set({ secrets, isLoading: false });
        } catch (error) {
            set({ error: getErrorMessage(error), isLoading: false });
        }
    },

    loadSecretsByBox: async (boxId: string) => {
        set({ isLoading: true, error: null });
        try {
            const secrets = await secretCommands.getSecretsByBoxId(boxId);
            const { boxSecrets } = get();
            const newBoxSecrets = new Map(boxSecrets);
            newBoxSecrets.set(boxId, secrets);
            set({ boxSecrets: newBoxSecrets, isLoading: false });
        } catch (error) {
            set({ error: getErrorMessage(error), isLoading: false });
        }
    },

    createSecret: async (boxId: string, data: SecretFormData) => {
        set({ isLoading: true, error: null });
        try {
            const secretId = await secretCommands.createSecret(
                boxId,
                data.name,
                data.value
            );

            const [allSecrets, boxSecretsArray] = await Promise.all([
                secretCommands.getAllSecrets(),
                secretCommands.getSecretsByBoxId(boxId)
            ]);

            const { boxSecrets } = get();
            const newBoxSecrets = new Map(boxSecrets);
            newBoxSecrets.set(boxId, boxSecretsArray);

            set({
                secrets: allSecrets,
                boxSecrets: newBoxSecrets,
                isLoading: false
            });
            return secretId;
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    updateSecret: async (secretId: string, data: Partial<SecretFormData>) => {
        set({ isLoading: true, error: null });
        try {
            await secretCommands.updateSecret(
                secretId,
                data.name || null,
                data.value || null
            );

            // Reload data after update
            const [allSecrets] = await Promise.all([
                secretCommands.getAllSecrets()
            ]);

            // Find the box ID for this secret and reload it
            const updatedSecret = allSecrets.find(s => s.id === secretId);
            const { boxSecrets } = get();

            if (updatedSecret) {
                const boxSecretsArray = await secretCommands.getSecretsByBoxId(updatedSecret.box_id);
                const newBoxSecrets = new Map(boxSecrets);
                newBoxSecrets.set(updatedSecret.box_id, boxSecretsArray);

                set({
                    secrets: allSecrets,
                    boxSecrets: newBoxSecrets,
                    isLoading: false
                });
            } else {
                set({
                    secrets: allSecrets,
                    isLoading: false
                });
            }
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    deleteSecret: async (secretId: string) => {
        set({ isLoading: true, error: null });
        try {
            const { secrets } = get();
            const secretToDelete = secrets.find(s => s.id === secretId);
            const targetBoxId = secretToDelete?.box_id;

            await secretCommands.deleteSecret(secretId);

            // Reload data after deletion
            const [allSecrets] = await Promise.all([
                secretCommands.getAllSecrets()
            ]);

            const { boxSecrets } = get();
            let newBoxSecrets = new Map(boxSecrets);
            if (targetBoxId) {
                const boxSecretsArray = await secretCommands.getSecretsByBoxId(targetBoxId);
                newBoxSecrets.set(targetBoxId, boxSecretsArray);
            }

            set({
                secrets: allSecrets,
                boxSecrets: newBoxSecrets,
                isLoading: false
            });
        } catch (error) {
            const errorMessage = getErrorMessage(error);
            set({ error: errorMessage, isLoading: false });
            throw new Error(errorMessage);
        }
    },

    revealSecretValue: async (secretId: string) => {
        try {
            // Always fetch fresh from backend - never cache
            const value = await secretCommands.revealSecretValue(secretId);
            return value;
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    },

    copySecret: async (secretId: string) => {
        try {
            // Fetch fresh value and copy immediately
            const value = await secretCommands.revealSecretValue(secretId);
            await copyToClipboard(value);
            // Value is immediately discarded - not stored anywhere
        } catch (error) {
            throw new Error(getErrorMessage(error));
        }
    },

    clearError: () => set({ error: null }),

    reset: () => set({
        ...initialState,
        boxSecrets: new Map(),
    }),
}));