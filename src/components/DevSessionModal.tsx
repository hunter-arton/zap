// src/components/DevSessionModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback } from "react";
import { Play, CheckCircle, XCircle, Loader2, X, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { useDevStore } from "../stores";
import { validateSessionName, generateSessionName } from "../utils";

interface DevSessionModalProps {
    isOpen: boolean;
    boxId: string;
    boxName: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export const DevSessionModal: React.FC<DevSessionModalProps> = ({
    isOpen,
    boxId,
    boxName,
    onSuccess,
    onCancel,
}) => {
    const [sessionName, setSessionName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);

    // Simple validation state
    const [validation, setValidation] = useState<{
        isValid: boolean;
        message?: string;
        isChecking?: boolean;
    }>({ isValid: false });

    const { createSession, validateSessionName: checkBackend } = useDevStore();

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            const suggested = generateSessionName(boxName);
            setSessionName(suggested);
            setError("");
            setValidation({ isValid: false });
            setShowInfoTooltip(false);
            setIsSubmitting(false);
        }
    }, [isOpen, boxName]);

    // Real-time validation
    const validateName = useCallback(async (name: string) => {
        const trimmed = name.trim();

        if (!trimmed) {
            setValidation({ isValid: false });
            return;
        }

        // Local validation first
        const localCheck = validateSessionName(trimmed);
        if (!localCheck.isValid) {
            setValidation({ isValid: false, message: localCheck.message });
            return;
        }

        // Backend uniqueness check
        setValidation({ isValid: false, isChecking: true });

        try {
            const isUnique = await checkBackend(trimmed);
            setValidation({
                isValid: isUnique,
                message: isUnique ? "Available" : "Name already exists"
            });
        } catch (error) {
            setValidation({ isValid: false, message: "Validation failed" });
        }
    }, [checkBackend]);

    // Debounced validation
    useEffect(() => {
        if (!sessionName.trim()) {
            setValidation({ isValid: false });
            return;
        }

        const timer = setTimeout(() => validateName(sessionName), 300);
        return () => clearTimeout(timer);
    }, [sessionName, validateName]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!validation.isValid) return;

        setError("");
        setIsSubmitting(true);

        try {
            await createSession(sessionName.trim(), boxId);
            onSuccess();
        } catch (error) {
            setError(error instanceof Error ? error.message : "Failed to start session");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && validation.isValid && !isSubmitting) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onCancel();
        }
    };

    const getIcon = () => {
        if (!sessionName.trim()) return null;
        if (validation.isChecking) return <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin text-blue-400" />;
        if (validation.isValid) return <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />;
        return <XCircle className="w-3 h-3 sm:w-4 sm:h-4 text-red-400" />;
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-black border-2 border-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">

                {/* 🎯 RESPONSIVE Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        <h3 className="text-sm sm:text-lg font-bold text-white font-mono">
                            Start Dev Session
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={HelpCircle}
                                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                                title="Session information"
                            />
                            {showInfoTooltip && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowInfoTooltip(false)}
                                    />
                                    <div className="absolute top-8 right-0 bg-black border-2 border-white rounded p-2 sm:p-3 z-20 w-56 sm:w-64 text-xs font-mono">
                                        <div className="text-white font-bold mb-1 sm:mb-2">Dev Session Info:</div>
                                        <div className="text-gray-400 space-y-1 sm:space-y-2">
                                            <div><strong>Purpose:</strong> Exposes secrets as environment variables for development.</div>
                                            <div><strong>Name:</strong> Lowercase letters, numbers, hyphens. 1-30 chars.</div>
                                            <div><strong>Security:</strong> Sessions auto-stop when inactive.</div>
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
                            disabled={isSubmitting}
                            title="Close modal"
                        />
                    </div>
                </div>

                {/* 🎯 RESPONSIVE Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="space-y-3 sm:space-y-5" onKeyDown={handleKeyPress}>
                        {/* Target Box Info */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Target Box
                            </label>
                            <div className="p-2 sm:p-3 bg-gray-950 border-2 border-gray-700 rounded font-mono">
                                <p className="text-white font-bold text-xs sm:text-sm">{boxName}</p>
                            </div>
                        </div>

                        {/* Session Name Input */}
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Session Name <span className="text-red-400">*</span>
                            </label>
                            <div className="relative">
                                <Input
                                    value={sessionName}
                                    onChange={(e) => setSessionName(e.target.value)}
                                    placeholder="my-dev-session"
                                    disabled={isSubmitting}
                                    error={validation.message && !validation.isValid ? validation.message : undefined}
                                    isValid={validation.isValid}
                                    autoFocus
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-3">
                                    {getIcon()}
                                </div>
                            </div>
                            <p className="text-gray-500 text-xs font-mono mt-1">
                                1-30 chars, lowercase letters, numbers, hyphens only
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
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!validation.isValid || isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                "Start Session"
                            )}
                        </Button>
                    </div>
                </form>

                {/* 🎯 RESPONSIVE Keyboard Shortcut Hint */}
                <div className="text-center mt-2 sm:mt-3">
                    <p className="text-xs text-gray-500 font-mono">
                        Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">Enter</kbd> to submit • <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">Esc</kbd> to cancel
                    </p>
                </div>
            </div>
        </div>
    );
};