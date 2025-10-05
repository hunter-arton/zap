// src/components/SelectionModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect, useCallback } from "react";
import { Trash2, Copy, X, ChevronDown, Package, Key, Code, Info } from "lucide-react";
import { Button } from "./Button";
import { useToastHelpers } from "./Toast";
import { useBulkStore, useBoxStore, useSecretStore, useDevStore } from "../stores";
import { useKeyboardShortcuts } from "../hooks/useKeyboard";
import { truncateName } from "../utils";
import type { Box, Secret } from "../types";

interface SelectionModalProps {
    isOpen: boolean;
    operation: "delete-boxes" | "copy-secrets" | "delete-secrets";
    onClose: () => void;
    currentBoxId?: string;
}

export const SelectionModal: React.FC<SelectionModalProps> = ({
    isOpen,
    operation,
    onClose,
    currentBoxId
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [targetId, setTargetId] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState(false);
    const [focusedIndex, setFocusedIndex] = useState<number>(0);
    const [showShortcutsTooltip, setShowShortcutsTooltip] = useState(false);

    const { boxes, loadBoxes } = useBoxStore();
    const { boxSecrets, loadSecretsByBox } = useSecretStore();
    const { isLoading, deleteSelectedBoxes, deleteSelectedSecrets, copySecretsToBox } = useBulkStore();
    const { sessions } = useDevStore();
    const toast = useToastHelpers();

    const isDeleteBoxes = operation === "delete-boxes";
    const isDeleteSecrets = operation === "delete-secrets";
    const isCopySecrets = operation === "copy-secrets";

    // Filter out boxes with active dev sessions
    const filterBoxes = (boxesToFilter: Box[]): Box[] => {
        return boxesToFilter.filter(box => {
            return !sessions.some(session =>
                session.box_name === box.name && session.is_active
            );
        });
    };

    // Get items based on operation
    const items = isDeleteBoxes
        ? filterBoxes(boxes)
        : (boxSecrets.get(currentBoxId!) || []);

    const targetBoxes = isCopySecrets
        ? filterBoxes(boxes.filter(box => box.id !== currentBoxId))
        : [];

    const selectedBox = targetBoxes.find(b => b.id === targetId);

    useEffect(() => {
        if (isOpen) {
            setSelectedIds([]);
            setTargetId(null);
            setShowDropdown(false);
            setFocusedIndex(0);
            setShowShortcutsTooltip(false);

            loadBoxes();

            if (currentBoxId && (operation === "copy-secrets" || operation === "delete-secrets")) {
                setTimeout(() => loadSecretsByBox(currentBoxId), 100);
            }
        }
    }, [isOpen, operation, currentBoxId]);

    // Auto-scroll focused item into view
    useEffect(() => {
        if (focusedIndex >= 0 && focusedIndex < items.length && isOpen) {
            const focusedElement = document.querySelector(`[data-item-index="${focusedIndex}"]`);
            if (focusedElement) {
                focusedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [focusedIndex, items.length, isOpen]);

    // Navigation functions
    const moveFocus = useCallback((direction: 'up' | 'down') => {
        if (items.length === 0) return;

        setFocusedIndex(prevIndex => {
            if (direction === 'up') {
                return prevIndex <= 0 ? items.length - 1 : prevIndex - 1;
            } else {
                return prevIndex >= items.length - 1 ? 0 : prevIndex + 1;
            }
        });
    }, [items.length]);

    const toggleFocusedSelection = useCallback(() => {
        if (focusedIndex >= 0 && focusedIndex < items.length) {
            const item = items[focusedIndex];
            toggleSelect(item.id);
        }
    }, [focusedIndex, items]);

    const selectAll = useCallback(() => {
        setSelectedIds(items.map(item => item.id));
    }, [items]);

    const handleSubmit = useCallback(async () => {
        if (!canSubmit) return;

        try {
            if (isDeleteBoxes) {
                await deleteSelectedBoxes(selectedIds);
                toast.success("Deleted", `${selectedIds.length} boxes deleted`);
            } else if (isDeleteSecrets) {
                await deleteSelectedSecrets(selectedIds, currentBoxId!);
                toast.success("Deleted", `${selectedIds.length} secrets deleted`);
            } else if (isCopySecrets && targetId) {
                await copySecretsToBox(selectedIds, currentBoxId!, targetId);
                toast.success("Copied", `${selectedIds.length} secrets copied`);
            }
            onClose();
        } catch (error) {
            toast.error("Failed", error instanceof Error ? error.message : "Try again");
        }
    }, [selectedIds, targetId, isDeleteBoxes, isDeleteSecrets, isCopySecrets, currentBoxId, onClose, toast]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'a',
                callback: () => {
                    console.log('Select all triggered');
                    selectAll();
                },
                description: 'Select all items'
            },
            {
                key: 'ArrowUp',
                callback: () => {
                    console.log('Arrow up triggered');
                    moveFocus('up');
                },
                description: 'Navigate up'
            },
            {
                key: 'ArrowDown',
                callback: () => {
                    console.log('Arrow down triggered');
                    moveFocus('down');
                },
                description: 'Navigate down'
            },
            {
                key: ' ',
                callback: () => {
                    console.log('Space triggered');
                    toggleFocusedSelection();
                },
                description: 'Toggle selection'
            },
            {
                key: 'Enter',
                callback: () => {
                    console.log('Enter triggered');
                    handleSubmit();
                },
                description: 'Perform action'
            },
            {
                key: 'Escape',
                callback: () => {
                    console.log('Escape triggered');
                    onClose();
                },
                description: 'Cancel'
            }
        ],
        enabled: isOpen && !showDropdown
    });

    if (!isOpen) return null;

    const title = isDeleteBoxes ? "Delete Boxes" : isDeleteSecrets ? "Delete Secrets" : "Copy Secrets";
    const icon = (isDeleteBoxes || isDeleteSecrets) ?
        <Trash2 className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" /> :
        <Copy className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />;

    const canSubmit = selectedIds.length > 0 && (isDeleteBoxes || isDeleteSecrets || targetId);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    const renderItem = (item: Box | Secret, index: number) => {
        const isBox = 'secrets_count' in item;
        const box = isBox ? item as Box : boxes.find(b => b.id === (item as Secret).box_id);
        const isSelected = selectedIds.includes(item.id);
        const isFocused = focusedIndex === index;

        return (
            <div
                key={item.id}
                data-item-index={index}
                className={`
                    bg-black border-2 rounded-lg p-2.5 sm:p-3 cursor-pointer
                    transition-all duration-200 ease-out
                    ${isFocused
                        ? 'border-white shadow-lg shadow-white/20'
                        : isSelected
                            ? 'border-gray-400 shadow-lg shadow-gray-400/20'
                            : 'border-gray-600 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/10'
                    }
                `}
                onClick={() => toggleSelect(item.id)}
                onMouseEnter={() => setFocusedIndex(index)}
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 rounded ${isSelected ? 'border-white bg-white' :
                            isFocused ? 'border-white' : 'border-gray-600'
                            }`}
                    />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white font-mono text-xs sm:text-sm">
                            {truncateName(item.name, 30)}
                        </h3>
                        <p className="text-xs text-gray-400 font-mono">
                            {isBox ? `${(item as Box).secrets_count} secrets` : `in ${box?.name || 'Unknown'}`}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                        {isBox ? (
                            <>
                                {(item as Box).dev_mode && <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />}
                            </>
                        ) : (
                            <Key className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50">
                <div className="w-full max-w-md h-[80vh] bg-black border-2 border-white rounded-lg flex flex-col">

                    {/* 🎯 RESPONSIVE Header with Info Button */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-3">
                            {icon}
                            <h1 className="text-sm sm:text-lg font-bold text-white font-mono">{title}</h1>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* 🎯 RESPONSIVE Shortcuts Info Button */}
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Info}
                                    onClick={() => setShowShortcutsTooltip(!showShortcutsTooltip)}
                                    title="Keyboard shortcuts"
                                />
                                {showShortcutsTooltip && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setShowShortcutsTooltip(false)}
                                        />
                                        <div className="absolute top-6 sm:top-8 right-0 bg-black border-2 border-white rounded p-2.5 sm:p-3 z-20 w-56 sm:w-64 text-xs font-mono">
                                            <div className="text-white font-bold mb-1.5 sm:mb-2">Keyboard Shortcuts:</div>
                                            <div className="text-gray-400 space-y-0.5 sm:space-y-1">
                                                <div className="flex justify-between">
                                                    <span>Navigate:</span>
                                                    <span className="text-white">↑ ↓</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Toggle selection:</span>
                                                    <span className="text-white">Space</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Select all:</span>
                                                    <span className="text-white">A</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Confirm action:</span>
                                                    <span className="text-white">Enter</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Cancel:</span>
                                                    <span className="text-white">Esc</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <Button variant="ghost" size="sm" icon={X} onClick={onClose} />
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Target selection for copy */}
                    {isCopySecrets && (
                        <div className="p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                            <button
                                onClick={() => setShowDropdown(!showDropdown)}
                                className="w-full px-3 py-2.5 sm:py-3 bg-black border-2 border-gray-600 hover:border-gray-400 text-white rounded font-mono text-xs sm:text-sm flex items-center justify-between transition-all duration-200"
                            >
                                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                    <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400 flex-shrink-0" />
                                    <div className="text-left min-w-0">
                                        {selectedBox ? (
                                            <>
                                                <div className="text-white font-medium">
                                                    {truncateName(selectedBox.name, 20)}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {selectedBox.secrets_count} secrets
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-400">Select destination box...</div>
                                        )}
                                    </div>
                                </div>
                                <ChevronDown className={`w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                            </button>
                        </div>
                    )}

                    {/* 🎯 RESPONSIVE Items list - SAME SCROLLABLE PATTERN */}
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                        {items.length === 0 ? (
                            <div className="text-center py-6 sm:py-8">
                                {isDeleteBoxes ?
                                    <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" /> :
                                    <Key className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                                }
                                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 font-mono">No {isDeleteBoxes ? 'Boxes' : 'Secrets'}</h3>
                                <p className="text-gray-400 text-xs sm:text-sm font-mono">No {isDeleteBoxes ? 'boxes' : 'secrets'} available</p>
                            </div>
                        ) : (
                            items.map((item, index) => renderItem(item, index))
                        )}
                    </div>

                    {/* 🎯 RESPONSIVE Clean Footer */}
                    <div className="p-4 sm:p-6 border-t border-gray-700 flex-shrink-0 space-y-3 sm:space-y-4">
                        {selectedIds.length > 0 && (
                            <p className="text-center text-blue-400 text-xs sm:text-sm font-mono">
                                {selectedIds.length} selected
                                {(isDeleteBoxes || isDeleteSecrets) && <span className="text-red-400 ml-2">⚠️ Cannot be undone</span>}
                            </p>
                        )}

                        <div className="flex gap-2 sm:gap-3">
                            <Button
                                variant="secondary"
                                onClick={onClose}
                                className="flex-1 h-10 sm:h-12"
                            >
                                Cancel
                            </Button>
                            <Button
                                variant={(isDeleteBoxes || isDeleteSecrets) ? "danger" : "primary"}
                                onClick={handleSubmit}
                                disabled={!canSubmit || isLoading}
                                className="flex-1 h-10 sm:h-12"
                            >
                                {isLoading ? (
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    (isDeleteBoxes || isDeleteSecrets) ? "Delete" : "Copy"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🎯 RESPONSIVE Target selection dropdown for copy */}
            {showDropdown && isCopySecrets && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-3 sm:p-4 z-[60]">
                    <div className="w-full max-w-md h-[70vh] bg-black border-2 border-white rounded-lg flex flex-col">
                        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Package className="w-4 h-4 sm:w-6 sm:h-6 text-blue-400" />
                                <h2 className="text-sm sm:text-lg font-bold text-white font-mono">Select Destination</h2>
                            </div>
                            <Button variant="ghost" size="sm" icon={X} onClick={() => setShowDropdown(false)} />
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2.5 sm:space-y-3">
                            {targetBoxes.map(box => (
                                <div
                                    key={box.id}
                                    className="bg-black border-2 border-gray-600 hover:border-gray-400 rounded-lg p-2.5 sm:p-3 cursor-pointer transition-all duration-200"
                                    onClick={() => { setTargetId(box.id); setShowDropdown(false); }}
                                >
                                    <div className="flex items-center gap-2 sm:gap-3">
                                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-white font-mono text-xs sm:text-sm">
                                                {truncateName(box.name, 25)}
                                            </h3>
                                            <p className="text-xs text-gray-400 font-mono">
                                                {box.secrets_count} secrets
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            {box.dev_mode && <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 sm:p-6 border-t border-gray-800 flex-shrink-0">
                            <Button
                                variant="secondary"
                                onClick={() => setShowDropdown(false)}
                                className="w-full h-10 sm:h-12"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};