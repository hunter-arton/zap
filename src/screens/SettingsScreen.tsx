// src/screens/SettingsScreen.tsx - FULLY RESPONSIVE
import React, { useState } from "react";
import {
    ArrowLeft,
    Download,
    Check,
    HelpCircle,
    Settings,
} from "lucide-react";
import { Button, Input } from "../components";
import { useToastHelpers } from "../components";
import { useSettings } from "../hooks";
import { useKeyboardShortcuts } from "../hooks/useKeyboard";
import { useImportExportStore } from "../stores";

interface SettingsScreenProps {
    onBack: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
    onBack,
}) => {
    const [showShortcuts, setShowShortcuts] = useState(false);

    const toast = useToastHelpers();
    const { exportVault } = useImportExportStore();

    const {
        timeoutInput,
        setTimeoutInput,
        settings,
        isLoading,
        hasChanges,
        handleTimeoutBlur,
        handleSaveSettings,
        handleBack,
    } = useSettings({ onBack });

    const handleExportVault = async () => {
        try {
            const vaultData = await exportVault();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const filename = `vault-backup--${timestamp}.json`;

            // Download file
            const blob = new Blob([vaultData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export complete!", `Vault exported as ${filename}`);
        } catch (error) {
            toast.error("Export failed", error instanceof Error ? error.message : "Export failed");
        }
    };

    // Wrap the existing handleSaveSettings to add toast
    const handleSaveWithToast = async () => {
        try {
            await handleSaveSettings();
            toast.success("Settings saved!", "Changes have been applied");
        } catch (error) {
            toast.error("Failed to save settings", error instanceof Error ? error.message : "Save failed");
        }
    };

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'Escape',
                callback: handleBack,
                description: 'Back to vault'
            },
            {
                key: 's',
                ctrl: true,
                callback: () => {
                    if (hasChanges) {
                        handleSaveWithToast();
                    }
                },
                description: 'Save settings'
            },
            {
                key: 'e',
                ctrl: true,
                callback: handleExportVault,
                description: 'Export vault'
            }
        ],
        enabled: true
    });

    if (isLoading && !settings) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-6xl h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                        <div className="text-white font-mono text-sm sm:text-base">Loading Settings...</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-6xl h-screen bg-black text-white flex flex-col overflow-hidden">

                    {/* 🎯 RESPONSIVE Header */}
                    <header className="px-3 py-4 sm:px-4 sm:py-6 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={ArrowLeft}
                                    onClick={handleBack}
                                    title="Back to vault"
                                />
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center">
                                    <Settings className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black" />
                                </div>
                                <div>
                                    <h1 className="text-sm sm:text-lg font-bold text-white font-mono">Settings</h1>
                                    <p className="text-xs text-gray-400 font-mono">Vault Configuration</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 sm:gap-2">
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={HelpCircle}
                                        onClick={() => setShowShortcuts(!showShortcuts)}
                                        title="Keyboard shortcuts"
                                    />

                                    {showShortcuts && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowShortcuts(false)} />
                                            <div className="absolute top-10 right-0 bg-black border-2 border-white rounded shadow-lg p-3 sm:p-4 z-50 w-72 sm:w-80">
                                                <h3 className="text-xs sm:text-sm font-bold text-white font-mono mb-2 sm:mb-3">Keyboard Shortcuts</h3>

                                                <div className="space-y-2 sm:space-y-3">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-300 font-mono mb-1 sm:mb-2">Navigation</h4>
                                                        <div className="space-y-1 text-xs font-mono">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Back to Vault</span>
                                                                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-white">Esc</kbd>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-300 font-mono mb-1 sm:mb-2">Actions</h4>
                                                        <div className="space-y-1 text-xs font-mono">
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Save Settings</span>
                                                                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-white">Ctrl+S</kbd>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-400">Export Vault</span>
                                                                <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-white">Ctrl+E</kbd>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* 🎯 RESPONSIVE Main Content */}
                    <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-4 sm:px-4 sm:py-6">
                        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">

                            {/* 🎯 RESPONSIVE Session Timeout Section */}
                            <div className="pb-6 sm:pb-8 border-b border-gray-700">
                                <div className="flex items-center justify-between mb-2 sm:mb-3">
                                    <h2 className="text-sm sm:text-lg font-bold text-white font-mono">Session Timeout</h2>
                                    {hasChanges && (
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={handleSaveWithToast}
                                            disabled={isLoading}
                                            icon={Check}
                                            title="Save timeout changes"
                                        />
                                    )}
                                </div>

                                <div className="max-w-md">
                                    <label className="text-xs sm:text-sm font-medium text-white font-mono mb-2 sm:mb-3 block">
                                        Auto-lock timeout
                                    </label>
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Input
                                            type="text"
                                            value={timeoutInput}
                                            onChange={(e) => setTimeoutInput(e.target.value)}
                                            onBlur={handleTimeoutBlur}
                                            className="w-16 sm:w-20 text-center"
                                            placeholder="5"
                                            disabled={isLoading}
                                        />
                                        <span className="text-gray-400 text-xs sm:text-sm font-mono">minutes</span>
                                    </div>
                                    <p className="text-gray-500 text-xs font-mono mt-1 sm:mt-2">
                                        Range: 5-60 minutes. Vault will auto-lock after this time.
                                    </p>
                                </div>
                            </div>

                            {/* 🎯 RESPONSIVE Export Section */}
                            <div className="pb-6 sm:pb-8 border-b border-gray-700">
                                <h2 className="text-sm sm:text-lg font-bold text-white font-mono mb-2 sm:mb-3">Backup & Export</h2>

                                <div>
                                    <h3 className="font-medium text-white font-mono mb-1 sm:mb-2 text-xs sm:text-sm">Export Vault Data</h3>
                                    <p className="text-gray-400 text-xs sm:text-sm font-mono mb-3 sm:mb-4 max-w-lg">
                                        Download a backup of your entire vault including all boxes and secrets.
                                        Data is automatically encrypted for secure storage.
                                    </p>

                                    {/* 🎯 RESPONSIVE Modal Style Button */}
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={handleExportVault}
                                        disabled={isLoading}
                                        icon={Download}
                                    >
                                        Export Vault
                                    </Button>
                                </div>
                            </div>

                            {/* 🎯 RESPONSIVE App Information */}
                            <div>
                                <h2 className="text-sm sm:text-lg font-bold text-white font-mono mb-2 sm:mb-3">About</h2>

                                <div className="grid grid-cols-2 gap-x-6 sm:gap-x-8 gap-y-1 sm:gap-y-2 text-xs sm:text-sm font-mono max-w-lg">
                                    <div className="text-gray-400">Application:</div>
                                    <div className="text-white">Zap Credential Manager</div>

                                    <div className="text-gray-400">Version:</div>
                                    <div className="text-white">v1.0.0</div>

                                    <div className="text-gray-400">Encryption:</div>
                                    <div className="text-white">AES-256-GCM</div>

                                    <div className="text-gray-400">Platform:</div>
                                    <div className="text-white">Tauri + React</div>

                                    <div className="text-gray-400">Architecture:</div>
                                    <div className="text-white">Passwordless Operations</div>
                                </div>
                            </div>

                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};