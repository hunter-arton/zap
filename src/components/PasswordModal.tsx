// src/components/PasswordModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect } from "react";
import { Shield, X, AlertTriangle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";

interface PasswordModalProps {
    isOpen: boolean;
    title: string;
    description: string;
    onSubmit: (password: string) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
    destructive?: boolean;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({
    isOpen,
    title,
    description,
    onSubmit,
    onCancel,
    isLoading = false,
    destructive = false,
}) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setPassword("");
            setError("");
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        if (!password.trim()) {
            setError("Password is required");
            return;
        }

        setError("");
        setIsSubmitting(true);

        try {
            await onSubmit(password.trim());
            // Modal will be closed by parent component on success
        } catch (error) {
            setError(error instanceof Error ? error.message : "Authentication failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && password.trim() && !isSubmitting && !isLoading) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onCancel();
        }
    };

    const canSubmit = password.trim() && !isSubmitting && !isLoading;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-black border-2 border-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">

                {/* 🎯 RESPONSIVE Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        {destructive ? (
                            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
                        ) : (
                            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        )}
                        <h3 className="text-sm sm:text-lg font-bold text-white font-mono">{title}</h3>
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

                {/* 🎯 RESPONSIVE Description */}
                <div className="mb-4 sm:mb-6">
                    <p className="text-gray-400 font-mono text-xs sm:text-sm leading-relaxed">
                        {description}
                    </p>
                    {destructive && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-900/20 border border-red-500 rounded">
                            <p className="text-red-400 text-xs sm:text-sm font-mono font-bold">
                                ⚠️ This action cannot be undone
                            </p>
                        </div>
                    )}
                </div>

                {/* 🎯 RESPONSIVE Form */}
                <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                    <div className="space-y-3 sm:space-y-5" onKeyDown={handleKeyPress}>
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1.5 sm:mb-2">
                                Master Password <span className="text-red-400">*</span>
                            </label>
                            <Input
                                variant="password"
                                value={password}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                                placeholder="Enter your master password"
                                disabled={isLoading || isSubmitting}
                                autoFocus
                                error={error}
                            />
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Error Display */}
                    {error && (
                        <div className="mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-900/20 border border-red-500 rounded">
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
                            variant={destructive ? "danger" : "primary"}
                            size="lg"
                            disabled={!canSubmit}
                            className="flex-1"
                        >
                            {(isLoading || isSubmitting) ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : destructive ? (
                                "Confirm"
                            ) : (
                                "Authenticate"
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