// src/types/secretTypes.ts
import { Box } from "./boxTypes";

export interface Secret {
    id: string;
    box_id: string; // Foreign key to box
    name: string;
    encrypted_value: EncryptedData;
    created_at: number; // Unix timestamp from chrono
    updated_at: number; // Unix timestamp from chrono
}

export interface EncryptedData {
    cipher: number[]; 
    nonce: number[];   
    tag: number[]; 
}

export interface Settings {
    password_timeout_minutes: number;
    theme: string;
}

export interface VaultStats {
    total_boxes: number;
    total_secrets: number;
    last_updated: number;
}

export interface SearchResults {
    matching_secrets: Secret[];
    matching_boxes: Box[];
    query: string;
    total_matches: number;
}