// src/hooks/useSettings.ts

import { useState, useEffect, useCallback } from "react";
import { useAuthStore, useSettingsStore } from "../stores";
import { useToastHelpers } from "../components/Toast";

interface UseSettingsOptions {
    onBack?: () => void;
}

export function useSettings(options: UseSettingsOptions = {}) {
    const { onBack } = options;

    // Form state (removed exportModal)
    const [timeoutInput, setTimeoutInput] = useState("5");

    // Get individual store values

    const sessionInfo = useAuthStore(state => state.sessionInfo);
    const isUnlocked = useAuthStore(state => state.isUnlocked);
    const settings = useSettingsStore(state => state.settings);
    const isLoading = useSettingsStore(state => state.isLoading);

    // Get methods separately
    const updateSessionTimeout = useAuthStore(state => state.updateSessionTimeout);
    const loadSettings = useSettingsStore(state => state.loadSettings);

    // Toast notifications
    const { success, error: showError } = useToastHelpers();

    // Load settings only once on mount
    useEffect(() => {
        console.log("⚙️ Settings hook mounted - loading settings");
        loadSettings().catch(console.error);
    }, []); // Empty dependency array

    // Update input when settings load
    useEffect(() => {
        if (settings) {
            setTimeoutInput(settings.password_timeout_minutes.toString());
            console.log("📄 Settings loaded, timeout:", settings.password_timeout_minutes);
        }
    }, [settings]);

    // Check if there are unsaved changes
    const hasChanges = useCallback(() => {
        const originalValue = settings?.password_timeout_minutes || 5;
        const currentValue = parseInt(timeoutInput) || 5;
        return currentValue !== originalValue && timeoutInput !== "";
    }, [settings, timeoutInput]);

    // Handle timeout input change
    const handleTimeoutChange = useCallback((value: string) => {
        setTimeoutInput(value);
    }, []);

    // Handle timeout input blur (validation)
    const handleTimeoutBlur = useCallback(() => {
        const parsed = parseInt(timeoutInput);
        if (isNaN(parsed) || parsed < 5) {
            setTimeoutInput("5");
        } else if (parsed > 60) {
            setTimeoutInput("60");
        }
    }, [timeoutInput]);

    // Save settings
    const handleSaveSettings = useCallback(async () => {
        if (!hasChanges()) {
            console.log("❌ No changes to save");
            return;
        }

        const timeoutValue = parseInt(timeoutInput) || 5;
        const validTimeout = Math.min(Math.max(timeoutValue, 5), 60);

        console.log("💾 Saving timeout:", validTimeout);

        try {
            // Update session timeout through auth store (which saves to backend)
            await updateSessionTimeout(validTimeout);

            // Force input to show saved value immediately
            setTimeoutInput(validTimeout.toString());

            // Reload settings to ensure UI sync
            await loadSettings();

            success("Settings Saved", `Session timeout updated to ${validTimeout} minutes.`);
            console.log("✅ Settings saved successfully");
        } catch (error) {
            console.error("❌ Settings save error:", error);
            showError("Save Failed", error instanceof Error ? error.message : "Could not save your preferences.");
        }
    }, [timeoutInput, hasChanges, updateSessionTimeout, loadSettings, success, showError]);

    // Handle back navigation
    const handleBack = useCallback(() => {
        console.log("🏠 Back button clicked");
        if (onBack) {
            onBack();
        }
    }, [onBack]);

    // Get session time left from backend
    const sessionTimeLeft = sessionInfo?.time_left_seconds ?? 0;

    return {
        // Form state (removed exportModal)
        timeoutInput,
        setTimeoutInput: handleTimeoutChange,

        // Settings state
        settings,
        isLoading,
        sessionTimeLeft,
        isUnlocked,

        // Computed state
        hasChanges: hasChanges(),

        // Handlers (removed handleExportVault)
        handleTimeoutBlur,
        handleSaveSettings,
        handleBack,
    };
}