// src/types/devTypes.ts

export interface ActiveSessionInfo {
    session_name: string;
    box_name: string;
    secrets_count: number;
    is_active: boolean;
}

export interface DevStats {
    total_boxes: number;
    dev_boxes: number;
    total_secrets: number;
    active_sessions_count: number;
}

export interface DevBoxInfo {
    id: string;
    name: string;
    description: string | null;
    secrets_count: number;
}

export interface CreateSessionRequest {
    session_name: string;
    box_id: string;
}

export interface SessionValidationResult {
    is_valid: boolean;
    message?: string;
}


export interface DevSessionsState {
    sessions: ActiveSessionInfo[];
    total_count: number;
    has_any_sessions: boolean;
}

export const SESSION_NAME_CONSTRAINTS = {
    MIN_LENGTH: 1,
    MAX_LENGTH: 30,
    PATTERN: /^[a-z0-9\-]{1,30}$/,
    ALLOWED_CHARS: 'lowercase letters, numbers, and hyphens only'
} as const;
