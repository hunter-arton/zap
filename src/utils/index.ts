// src/utils/index.ts

import type { ValidationResult } from "../types";

// TIME & DATE FORMATTING 

// Time formatting
export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// Date formatting - handles Unix timestamps  
export function formatDate(timestamp: number): string {
    try {
        return new Date(timestamp * 1000).toLocaleDateString();
    } catch {
        return "Unknown";
    }
}

// String dates (for exports)
export function formatDateString(dateString: string): string {
    try {
        return new Date(dateString).toLocaleDateString();
    } catch {
        return "Unknown";
    }
}

// Session duration formatting
export function formatSessionDuration(startTime: number): string {
    const now = Date.now() / 1000; // Current time in seconds
    const duration = Math.floor(now - startTime);

    if (duration < 60) {
        return `${duration}s`;
    } else if (duration < 3600) {
        return `${Math.floor(duration / 60)}m`;
    } else {
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }
}

// BOX VALIDATION

// Box name validation - matches backend (50 chars max, cannot be empty)
export function validateBoxName(name: string): ValidationResult {
    const trimmed = name.trim();

    if (trimmed.length === 0) {
        return { isValid: false, message: "Box name cannot be empty" };
    }

    if (trimmed.length > 50) {
        return { isValid: false, message: "Box name cannot exceed 50 characters" };
    }

    return { isValid: true };
}

// Box description validation - matches backend (75 chars max)
export function validateBoxDescription(description: string): ValidationResult {
    if (description.length > 75) {
        return { isValid: false, message: "Box description cannot exceed 75 characters" };
    }

    return { isValid: true };
}

// SECRET VALIDATION 

// Secret name validation - matches backend (2-75 chars for .ENV compatibility)
export function validateSecretName(name: string): ValidationResult {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
        return { isValid: false, message: "Secret name must be at least 2 characters for .ENV compatibility" };
    }

    if (trimmed.length > 75) {
        return { isValid: false, message: "Secret name cannot exceed 75 characters" };
    }

    // Check for control characters (except tab)
    if (trimmed.split('').some(c => c.charCodeAt(0) < 32 && c !== '\t')) {
        return { isValid: false, message: "Secret name cannot contain control characters" };
    }

    return { isValid: true };
}

// TAG VALIDATION 

// Tag validation - matches backend (1-15 chars, lowercase letters, numbers, and hyphens only, max 5 per box)
const TAG_REGEX = /^[a-z0-9\-]{1,15}$/;

export function validateTags(tags: string[]): ValidationResult {
    if (tags.length > 5) {
        return { isValid: false, message: "Maximum 5 tags allowed per box" };
    }

    for (const tag of tags) {
        if (!tag || tag.length === 0) {
            return { isValid: false, message: "Tags cannot be empty" };
        }

        if (!TAG_REGEX.test(tag)) {
            return {
                isValid: false,
                message: "Tags must be 1-15 characters, lowercase letters, numbers, and hyphens only"
            };
        }
    }

    // Check for duplicates
    const uniqueTags = new Set(tags);
    if (uniqueTags.size !== tags.length) {
        return { isValid: false, message: "Duplicate tags are not allowed" };
    }

    return { isValid: true };
}

// Parse tags from space-separated string - matches backend format
export function parseTags(tagsString: string): string[] {
    return tagsString
        .split(" ")
        .map(tag => tag.trim().toLowerCase())
        .filter(tag => tag.length > 0)
        .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
}

// DEV SESSION VALIDATION 

// Session name validation - matches backend exactly (1-30 chars, ^[a-z0-9\-]{1,30}$)
const SESSION_NAME_REGEX = /^[a-z0-9\-]{1,30}$/;

export function validateSessionName(sessionName: string): ValidationResult {
    const trimmed = sessionName.trim();

    if (trimmed.length === 0) {
        return { isValid: false, message: "Session name cannot be empty" };
    }

    if (trimmed.length > 30) {
        return { isValid: false, message: "Session name cannot exceed 30 characters" };
    }

    if (!SESSION_NAME_REGEX.test(trimmed)) {
        return {
            isValid: false,
            message: "Session name must be 1-30 characters, lowercase letters, numbers, and hyphens only"
        };
    }

    return { isValid: true };
}

// Generate session name from box name
export function generateSessionName(boxName: string): string {
    return boxName
        .toLowerCase()
        .replace(/[^a-z0-9\-]/g, '-')  // Replace invalid chars with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
        .substring(0, 30);             // Limit to 30 chars
}

// Check if session name format is valid (format only, not checking backend)
export function isValidSessionNameFormat(sessionName: string): boolean {
    return validateSessionName(sessionName).isValid;
}

// MASTER PASSWORD VALIDATION


export function validateMasterPassword(password: string): ValidationResult {
    if (!password) {
        return { isValid: false, message: "Master password is required" };
    }
    if (password.length < 8) {
        return { isValid: false, message: "Master password must be at least 8 characters" };
    }
    return { isValid: true };
}

// ==================== CLIPBOARD FUNCTIONALITY ====================

// Enhanced secure clipboard copy with fallback methods
export async function copyToClipboard(text: string): Promise<void> {
    console.log("📋 Attempting to copy to clipboard...");

    // Method 1: Modern Clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            console.log("✅ Copied using modern Clipboard API");
            return;
        } catch (error) {
            console.warn("⚠️ Modern clipboard failed:", error);
        }
    } else {
        console.warn("⚠️ Modern Clipboard API not available (secure context required)");
    }

    // Method 2: Legacy fallback using execCommand
    try {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        // Enhanced styling for better compatibility
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        textarea.style.width = "1px";
        textarea.style.height = "1px";
        textarea.style.opacity = "0";
        textarea.style.pointerEvents = "none";
        textarea.style.border = "none";
        textarea.style.outline = "none";
        textarea.style.background = "transparent";
        textarea.setAttribute("readonly", "");
        textarea.setAttribute("aria-hidden", "true");
        textarea.setAttribute("tabindex", "-1");

        document.body.appendChild(textarea);

        // Multiple selection attempts for better compatibility
        textarea.focus();
        textarea.select();

        if (textarea.setSelectionRange) {
            textarea.setSelectionRange(0, text.length);
        }

        // Small delay for compatibility
        await new Promise(resolve => setTimeout(resolve, 10));

        const success = document.execCommand("copy");
        document.body.removeChild(textarea);

        if (success) {
            console.log("✅ Copied using legacy execCommand");
            return;
        } else {
            throw new Error("execCommand returned false");
        }
    } catch (error) {
        console.error("❌ Legacy clipboard fallback failed:", error);
    }

}

// GENERAL UTILITIES

// Get error message from unknown error
export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "An unknown error occurred";
}

// Session time utilities (for vault session timeout)
export function isSessionWarning(timeLeft: number): boolean {
    return timeLeft <= 30 && timeLeft > 0;
}

export function isSessionExpired(timeLeft: number): boolean {
    return timeLeft <= 0;
}

// BOX CAPACITY UTILITIES

// Check if box can accept more secrets (backend limit is 75)
export function canBoxAcceptSecret(secretsCount: number): boolean {
    return secretsCount < 75;
}

// Get remaining capacity for a box
export function getBoxRemainingCapacity(secretsCount: number): number {
    return Math.max(0, 75 - secretsCount);
}

// Check if box is at capacity
export function isBoxAtCapacity(secretsCount: number): boolean {
    return secretsCount >= 75;
}

// ENV VARIABLE UTILITIES

// Convert secret name to valid .ENV variable name (matches backend logic)
export function toEnvVarName(secretName: string, prefix?: string): string {
    const cleanName = secretName
        .toUpperCase()
        .split('')
        .map(c => /[A-Z0-9]/.test(c) ? c : '_')
        .join('');

    // Remove consecutive underscores and trim
    const finalName = cleanName
        .split('_')
        .filter(s => s.length > 0)
        .join('_');

    if (prefix) {
        const cleanPrefix = prefix
            .toUpperCase()
            .split('')
            .map(c => /[A-Z0-9]/.test(c) ? c : '_')
            .join('');
        return `${cleanPrefix}_${finalName}`;
    }

    return finalName;
}

// Text truncation utility
export function truncateName(name: string, maxLength: number = 15): string {
    return name.length > maxLength ? `${name.substring(0, maxLength)}...` : name;
}

// PASSWORD VALIDATION 

// Password validation - simple requirements
export function validatePassword(password: string): ValidationResult {
    if (!password) {
        return { isValid: false, message: "Password is required" };
    }
    if (password.length < 8) {
        return { isValid: false, message: "Password must be at least 8 characters" };
    }
    return { isValid: true };
}