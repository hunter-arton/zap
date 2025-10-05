// src/components/SecretModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect } from "react";
import { Key, X, Eye, EyeOff, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { validateSecretName } from "../utils";
import type { Secret, SecretFormData } from "../types";

interface SecretModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: Secret & { decryptedValue?: string };
    onSubmit: (data: SecretFormData | Partial<SecretFormData>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const SecretModal: React.FC<SecretModalProps> = ({
    isOpen,
    mode,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const [name, setName] = useState("");
    const [value, setValue] = useState("");
    const [showValue, setShowValue] = useState(false);
    const [error, setError] = useState("");
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setValue(initialData.decryptedValue || "");
            } else {
                setName("");
                setValue("");
            }
            setShowValue(false);
            setError("");
            setShowInfoTooltip(false);
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                const nameValidation = validateSecretName(name);
                if (!nameValidation.isValid) {
                    setError(nameValidation.message || "Invalid secret name");
                    return;
                }

                if (!value.trim()) {
                    setError("Secret value cannot be empty");
                    return;
                }

                const submitData: SecretFormData = {
                    name: name.trim(),
                    value: value.trim(),
                };

                await onSubmit(submitData);

            } else if (initialData) {
                const updateData: Partial<SecretFormData> = {};

                if (name.trim() && name !== initialData?.name) {
                    const nameValidation = validateSecretName(name);
                    if (!nameValidation.isValid) {
                        setError(nameValidation.message || "Invalid secret name");
                        return;
                    }
                    updateData.name = name.trim();
                }

                if (value.trim()) {
                    updateData.value = value.trim();
                }

                if (Object.keys(updateData).length === 0) {
                    setError("No changes to save");
                    return;
                }

                await onSubmit(updateData);
            }

        } catch (error) {
            setError(error instanceof Error ? error.message : "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Enter key press (Ctrl+Enter for multiline textarea)
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && e.ctrlKey && canSubmit && !isSubmitting && !isLoading) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onCancel();
        }
    };

    const canSubmit = mode === "create" ? name.trim() && value.trim() : true;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-black border-2 border-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">

                {/* 🎯 RESPONSIVE Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Key className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="text-sm sm:text-lg font-bold text-white font-mono">
                            {mode === "create" ? "Create Secret" : "Edit Secret"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={HelpCircle}
                                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                                title="Secret information"
                            />
                            {showInfoTooltip && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowInfoTooltip(false)}
                                    />
                                    <div className="absolute top-8 right-0 bg-black border-2 border-white rounded p-2 sm:p-3 z-20 w-56 sm:w-64 text-xs font-mono">
                                        <div className="text-white font-bold mb-1 sm:mb-2">Secret Info:</div>
                                        <div className="text-gray-400 space-y-1 sm:space-y-2">
                                            <div><strong>Name:</strong> Alphanumeric, underscores, hyphens. 1-50 chars.</div>
                                            <div><strong>Value:</strong> Any text, passwords, API keys, certificates, etc.</div>
                                            <div><strong>Security:</strong> Values are encrypted and auto-hide after 30s.</div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={X}
                            onClick={onCancel}
                            disabled={isLoading || isSubmitting}
                            title="Close modal"
                        />
                    </div>
                </div>

                {/* 🎯 RESPONSIVE Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="space-y-3 sm:space-y-5" onKeyDown={handleKeyPress}>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Secret Name {mode === "create" && <span className="text-red-400">*</span>}
                            </label>
                            <Input
                                value={name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                placeholder="API_KEY"
                                disabled={isLoading || isSubmitting}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Secret Value {mode === "create" && <span className="text-red-400">*</span>}
                                {mode === "edit" && <span className="text-gray-500"> (optional)</span>}
                            </label>
                            <div className="relative">
                                <textarea
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    placeholder={mode === "create" ? "Enter secret value..." : "Leave empty to keep current value..."}
                                    disabled={isLoading || isSubmitting}
                                    className={`w-full px-2.5 py-2 pr-8 text-xs sm:px-4 sm:py-3 sm:pr-12 sm:text-sm bg-black border-2 border-gray-600 rounded text-white font-mono resize-none hover:border-gray-500 focus:border-white transition-colors outline-none ${!showValue ? 'text-security-disc' : ''
                                        }`}
                                    style={{
                                        WebkitTextSecurity: showValue ? 'none' : 'disc'
                                    } as React.CSSProperties}
                                    rows={4}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowValue(!showValue)}
                                    disabled={isLoading || isSubmitting}
                                    className="absolute right-2 top-2 sm:right-3 sm:top-3 text-gray-400 hover:text-white transition-colors"
                                    title={showValue ? "Hide value" : "Show value"}
                                >
                                    {showValue ?
                                        <EyeOff className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> :
                                        <Eye className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                                    }
                                </button>
                            </div>
                            <p className="text-gray-500 text-xs font-mono mt-1">
                                {value.length} characters
                            </p>
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Error Display */}
                    {error && (
                        <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-red-900/20 border border-red-500 rounded">
                            <p className="text-red-400 text-xs sm:text-sm font-mono">{error}</p>
                        </div>
                    )}

                    {/* 🎯 RESPONSIVE Buttons */}
                    <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                        <Button
                            type="button"
                            variant="secondary"
                            size="lg"
                            onClick={onCancel}
                            disabled={isLoading || isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!canSubmit || isLoading || isSubmitting}
                            className="flex-1"
                        >
                            {(isLoading || isSubmitting) ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : mode === "create" ? (
                                "Create Secret"
                            ) : (
                                "Update Secret"
                            )}
                        </Button>
                    </div>
                </form>

                {/* 🎯 RESPONSIVE Keyboard Shortcut Hint */}
                <div className="text-center mt-2 sm:mt-3">
                    <p className="text-xs text-gray-500 font-mono">
                        Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">Ctrl+Enter</kbd> to submit • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">Esc</kbd> to cancel
                    </p>
                </div>
            </div>
        </div>
    );
};