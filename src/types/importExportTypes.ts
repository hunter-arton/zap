// src/types/importExportTypes.ts

export interface VaultExport {
    version: string;
    total_boxes: number;
    total_secrets: number;
    boxes: BoxExport[];
}

export interface BoxExport {
    name: string;
    description: string | null;
    tags: string[];
    dev_mode: boolean;
    secrets: SecretExport[];
}

export interface SecretExport {
    name: string;
    value: string;
}

export interface ImportResult {
    boxes_imported: number;
    secrets_imported: number;
    errors: string[];
}