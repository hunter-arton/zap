// src/components/BoxModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect } from "react";
import { Box, X, HelpCircle } from "lucide-react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Toggle } from "./Toggle";
import { validateBoxName, validateBoxDescription, validateTags, parseTags } from "../utils";
import type { Box as BoxType, BoxFormData } from "../types";

interface BoxModalProps {
    isOpen: boolean;
    mode: "create" | "edit";
    initialData?: BoxType;
    onSubmit: (data: BoxFormData | Partial<BoxFormData>) => Promise<void>;
    onCancel: () => void;
    isLoading?: boolean;
}

export const BoxModal: React.FC<BoxModalProps> = ({
    isOpen,
    mode,
    initialData,
    onSubmit,
    onCancel,
    isLoading = false,
}) => {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [tagsString, setTagsString] = useState("");
    const [devMode, setDevMode] = useState(true);
    const [error, setError] = useState("");
    const [tagsError, setTagsError] = useState("");
    const [showInfoTooltip, setShowInfoTooltip] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setName(initialData.name);
                setDescription(initialData.description || "");
                setTagsString(initialData.tags.join(" "));
                setDevMode(initialData.dev_mode);
            } else {
                setName("");
                setDescription("");
                setTagsString("");
                setDevMode(true);
            }
            setError("");
            setTagsError("");
            setShowInfoTooltip(false);
            setIsSubmitting(false);
        }
    }, [isOpen, initialData]);

    // Real-time validation for tags
    useEffect(() => {
        if (tagsString.trim()) {
            const tags = parseTags(tagsString);
            const tagsValidation = validateTags(tags);
            setTagsError(tagsValidation.isValid ? "" : tagsValidation.message || "");
        } else {
            setTagsError("");
        }
    }, [tagsString]);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setError("");
        setIsSubmitting(true);

        try {
            if (mode === "create") {
                const nameValidation = validateBoxName(name);
                if (!nameValidation.isValid) {
                    setError(nameValidation.message || "Invalid box name");
                    return;
                }

                if (description) {
                    const descValidation = validateBoxDescription(description);
                    if (!descValidation.isValid) {
                        setError(descValidation.message || "Invalid description");
                        return;
                    }
                }

                if (tagsString.trim() && tagsError) {
                    setError(tagsError);
                    return;
                }

                const submitData: BoxFormData = {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    tags: parseTags(tagsString),
                    dev_mode: devMode,
                };

                await onSubmit(submitData);

            } else {
                const updateData: Partial<BoxFormData> = {};

                if (name.trim() && name !== initialData?.name) {
                    const nameValidation = validateBoxName(name);
                    if (!nameValidation.isValid) {
                        setError(nameValidation.message || "Invalid box name");
                        return;
                    }
                    updateData.name = name.trim();
                }

                if (description !== (initialData?.description || "")) {
                    if (description) {
                        const descValidation = validateBoxDescription(description);
                        if (!descValidation.isValid) {
                            setError(descValidation.message || "Invalid description");
                            return;
                        }
                    }
                    updateData.description = description.trim() || undefined;
                }

                const tags = parseTags(tagsString);
                const currentTags = initialData?.tags || [];
                if (tags.length !== currentTags.length || !tags.every((tag, i) => tag === currentTags[i])) {
                    if (tagsString.trim() && tagsError) {
                        setError(tagsError);
                        return;
                    }
                    updateData.tags = tags;
                }

                if (devMode !== initialData?.dev_mode) {
                    updateData.dev_mode = devMode;
                }

                await onSubmit(updateData);
            }

        } catch (error) {
            setError(error instanceof Error ? error.message : "Operation failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Ctrl+Enter key press
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && canSubmit && !isSubmitting && !isLoading) {
            e.preventDefault();
            handleSubmit();
        }
        if (e.key === "Escape") {
            onCancel();
        }
    };

    const canSubmit = mode === "create" ? name.trim() && !tagsError : !tagsError;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50" onKeyDown={handleKeyPress}>
            <div className="bg-black border-2 border-white rounded-lg p-4 sm:p-6 w-full max-w-md mx-auto">

                {/* 🎯 RESPONSIVE Header */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Box className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                        <h3 className="text-sm sm:text-lg font-bold text-white font-mono">
                            {mode === "create" ? "Create Box" : "Edit Box"}
                        </h3>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                icon={HelpCircle}
                                onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                                title="Box information"
                            />
                            {showInfoTooltip && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowInfoTooltip(false)}
                                    />
                                    <div className="absolute top-8 right-0 bg-black border-2 border-white rounded p-2 sm:p-3 z-20 w-56 sm:w-64 text-xs font-mono">
                                        <div className="text-white font-bold mb-1 sm:mb-2">Box Info:</div>
                                        <div className="text-gray-400 space-y-1 sm:space-y-2">
                                            <div><strong>Tags:</strong> Separate with spaces. Lowercase letters, numbers, hyphens. Max 5 tags, 15 chars each.</div>
                                            <div><strong>Dev Mode:</strong> Enables .ENV sessions for development.</div>
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
                    <div className="space-y-3 sm:space-y-5">
                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Box Name {mode === "create" && <span className="text-red-400">*</span>}
                            </label>
                            <Input
                                value={name}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                                placeholder="My API Keys"
                                disabled={isLoading || isSubmitting}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Description (optional)
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Brief description of this box..."
                                disabled={isLoading || isSubmitting}
                                className="w-full px-2.5 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm bg-black border-2 border-gray-600 rounded text-white font-mono resize-none hover:border-gray-500 focus:border-white transition-colors outline-none"
                                rows={3}
                                maxLength={75}
                            />
                            <p className="text-gray-500 text-xs font-mono mt-1">{description.length}/75</p>
                        </div>

                        <div>
                            <label className="block text-xs sm:text-sm font-medium text-white font-mono mb-1 sm:mb-2">
                                Tags (optional)
                            </label>
                            <Input
                                value={tagsString}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagsString(e.target.value)}
                                placeholder="api prod auth"
                                disabled={isLoading || isSubmitting}
                                error={tagsError}
                                isValid={tagsString.trim() ? !tagsError : undefined}
                            />
                            <p className="text-gray-500 text-xs font-mono mt-1">
                                Separate tags with spaces (e.g., "api prod auth")
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-1 sm:pt-2">
                            <label className="text-xs sm:text-sm font-medium text-white font-mono">
                                Dev Mode
                            </label>
                            <Toggle
                                checked={devMode}
                                onChange={setDevMode}
                                size="sm"
                                disabled={isLoading || isSubmitting}
                            />
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
                                "Create Box"
                            ) : (
                                "Update Box"
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