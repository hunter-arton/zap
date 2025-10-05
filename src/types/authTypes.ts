// src/types/authTypes.ts

export interface AuthConfig {
    session_timeout_minutes: number;
    master_password_hash: string | null;
    salt: number[];
}

export interface SessionInfo {
    is_locked: boolean;
    time_left_seconds: number;
}