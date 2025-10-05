// src/types/uiTypes.ts
import { Box } from "./boxTypes";

export interface SecretFormData {
    name: string;
    value: string;
    box_id?: string;
}

export interface BoxFormData {
    name: string;
    description?: string;
    tags: string[];
    dev_mode: boolean;
}

// Frontend-only UI state types
export interface SelectableSecret {
    id: string;
    name: string;
    box_id: string;
    selected: boolean;
}

export interface SelectableBox {
    id: string;
    name: string;
    description: string | null;
    tags: string[];
    secrets_count: number;
    dev_mode: boolean;
    selected: boolean;
}

export interface ValidationResult {
    isValid: boolean;
    message?: string;
}

export interface BoxViewState {
    selectedBox: Box | null;
    showSecrets: boolean;
    secretsLoaded: boolean;
}
