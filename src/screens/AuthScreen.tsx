// src/screens/AuthScreen.tsx - FULLY RESPONSIVE WITH LOGO
import React, { useState, useEffect } from "react";
import { Lock, Shield, Clock, X } from "lucide-react";
import { Button, Input } from "../components";
import { useToastHelpers } from "../components";
import { useAuthStore } from "../stores";
import { validatePassword } from "../utils";

interface AuthScreenProps {
    onSuccess: () => void;
    isSessionExpired?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
    onSuccess,
    isSessionExpired = false,
}) => {
    // Local state
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const toast = useToastHelpers();

    // Auth store
    const {
        isUnlocked,
        isFirstTime,
        isLoading,
        error,
        mode,
        initialize,
        unlock,
        clearError
    } = useAuthStore();

    // Initialize auth store on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Call onSuccess when authentication succeeds
    useEffect(() => {
        if (isUnlocked) {
            if (mode === "first-time") {
                toast.success("Vault created!", "Your secure vault is ready to use");
            } else {
                toast.success("Welcome back!", "Vault unlocked successfully");
            }
            onSuccess();
        }
    }, [isUnlocked, onSuccess, mode, toast]);

    // Validation
    const passwordValidation = validatePassword(password);
    const confirmValidation = mode === "first-time" && confirmPassword
        ? password === confirmPassword
            ? { isValid: true }
            : { isValid: false, message: "Passwords do not match" }
        : { isValid: true };

    const canSubmit = mode === "first-time"
        ? password && confirmPassword && passwordValidation.isValid && confirmValidation.isValid
        : password && passwordValidation.isValid;

    // Handlers
    const handleSubmit = async () => {
        if (!canSubmit || isLoading) return;

        try {
            if (mode === "first-time") {
                await unlock(password, confirmPassword);
            } else {
                await unlock(password);
            }
            // onSuccess will be called automatically via useEffect when isUnlocked becomes true
        } catch (error) {
            toast.error("Authentication failed", error instanceof Error ? error.message : "Authentication failed");
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && canSubmit && !isLoading) {
            handleSubmit();
        }
    };

    const handleClearError = () => {
        clearError();
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-3 sm:p-4">
            <div className="w-full max-w-md space-y-6 sm:space-y-8">
                {/* 🎯 RESPONSIVE Logo */}
                <div className="text-center">
                    <div className="flex justify-center mb-4 sm:mb-6">
                        <img 
                            src="/logo.svg" 
                            alt="Zap Logo" 
                            className="w-16 h-16 sm:w-20 sm:h-20"
                        />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-white mb-1 sm:mb-2 font-mono tracking-wider">ZAP</h1>
                    <p className="text-gray-400 text-xs sm:text-sm font-mono tracking-wide">Secure Credential Manager</p>
                </div>

                {/* 🎯 RESPONSIVE Session Expired Alert */}
                {isSessionExpired && (
                    <div className="bg-gray-900 border border-yellow-400 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                            <div className="flex-1">
                                <h3 className="text-yellow-400 font-bold font-mono text-xs sm:text-sm">Session Expired</h3>
                                <p className="text-gray-400 font-mono text-xs mt-1">Your session timed out for security. Please log in again.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 🎯 RESPONSIVE Header */}
                <div className="text-center mb-4 sm:mb-6">
                    <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                        {isFirstTime ? (
                            <>
                                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                <span className="text-sm sm:text-lg font-bold text-white font-mono">Create Your Vault</span>
                            </>
                        ) : (
                            <>
                                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                <span className="text-sm sm:text-lg font-bold text-white font-mono">
                                    {isSessionExpired ? "Restore Session" : "Unlock Vault"}
                                </span>
                            </>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-gray-400 font-mono">
                        {isFirstTime
                            ? "Choose a strong master password to protect your secrets"
                            : "Enter your master password to continue"
                        }
                    </p>
                </div>

                {/* 🎯 RESPONSIVE Error Display */}
                {error && (
                    <div className="bg-red-900/30 border border-red-500 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex-1">
                                <p className="text-red-400 font-mono text-xs sm:text-sm font-bold mb-1">Authentication Error</p>
                                <p className="text-red-300 font-mono text-xs">{error}</p>
                            </div>
                            <button
                                onClick={handleClearError}
                                className="text-red-400 hover:text-red-300 transition-colors"
                                title="Dismiss error"
                            >
                                <X className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* 🎯 RESPONSIVE Loading State */}
                {isLoading && !password && (
                    <div className="text-center">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        <p className="text-gray-400 font-mono text-xs sm:text-sm">
                            {isFirstTime ? "Setting up vault..." : "Initializing..."}
                        </p>
                    </div>
                )}

                {/* 🎯 RESPONSIVE Form */}
                {(!isLoading || password) && (
                    <>
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                            <Input
                                variant="password"
                                label={isFirstTime ? "Master Password" : "Password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={handleKeyPress}
                                placeholder={isFirstTime ? "Create a strong password" : "Enter your master password"}
                                error={password && !passwordValidation.isValid ? passwordValidation.message : undefined}
                                autoFocus
                                disabled={isLoading}
                            />

                            {isFirstTime && (
                                <Input
                                    variant="password"
                                    label="Confirm Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Confirm your password"
                                    error={confirmPassword && !confirmValidation.isValid ? confirmValidation.message : undefined}
                                    disabled={isLoading}
                                />
                            )}
                        </div>

                        {/* 🎯 RESPONSIVE Requirements */}
                        {isFirstTime && (
                            <div className="mb-4 sm:mb-6 text-xs text-gray-400 font-mono">
                                <div className="mb-1">Password Requirements:</div>
                                <div className="text-gray-500">
                                    • Minimum 8 characters<br />
                                    • Use a unique, strong password<br />
                                    • This cannot be recovered if lost
                                </div>
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Submit Button */}
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={handleSubmit}
                            disabled={isLoading || !canSubmit}
                            className="w-full"
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                            ) : isFirstTime ? (
                                "Create Vault"
                            ) : isSessionExpired ? (
                                "Restore Session"
                            ) : (
                                "Unlock Vault"
                            )}
                        </Button>

                        {/* 🎯 RESPONSIVE Keyboard Shortcut Hint */}
                        <div className="text-center">
                            <p className="text-xs text-gray-500 font-mono">
                                Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-xs">Enter</kbd> to submit
                            </p>
                        </div>
                    </>
                )}

                {/* 🎯 RESPONSIVE Security Info */}
                <div className="text-center text-xs text-gray-500 font-mono">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap">
                        <span>AES-256 Encryption</span>
                        <span>•</span>
                        <span>Auto-Lock Sessions</span>
                        <span>•</span>
                        <span>Zero-Knowledge</span>
                    </div>
                </div>
            </div>
        </div>
    );
};