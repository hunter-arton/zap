// src/types/boxTypes.ts

export interface Box {
    id: string;
    name: string;
    description: string | null;
    tags: string[];
    dev_mode: boolean;
    secrets_count: number;
    created_at: number; // Unix timestamp from chrono
    updated_at: number; // Unix timestamp from chrono
}

export interface BoxStats {
    total_boxes: number;
    dev_boxes: number;
    total_secrets: number;
}