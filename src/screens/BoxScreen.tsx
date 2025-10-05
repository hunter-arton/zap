// src/screens/BoxScreen.tsx - FULLY RESPONSIVE
import React, { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, Plus, Key, Menu, Trash2, Copy, Box as BoxIcon, Search } from "lucide-react";
import { Button } from "../components/Button";
import { SecretModal } from "../components/SecretModal";
import { SecretCard } from "../components/SecretCard";
import { SelectionModal } from "../components/SelectionModal";
import { ShortcutsTooltip } from "../components/ShortcutsTooltip";
import { useToastHelpers } from "../components";
import { useBoxStore, useSecretStore, useSearchStore, useDevStore } from "../stores";
import { useKeyboardShortcuts } from "../hooks/useKeyboard";
import type { Secret, SecretFormData, Box } from "../types";

interface BoxScreenProps {
    boxId: string;
    onNavigateBack: () => void;
}

// Enhanced Secret type with temporary reveal state
interface SecretWithReveal extends Secret {
    isRevealed: boolean;
    decryptedValue?: string;
    isDecrypting?: boolean;
}

export const BoxScreen: React.FC<BoxScreenProps> = ({
    boxId,
    onNavigateBack,
}) => {
    const [currentBox, setCurrentBox] = useState<Box | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showMenu, setShowMenu] = useState(false);
    const [focusedSecretIndex, setFocusedSecretIndex] = useState<number>(-1);

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Track only reveal states - NO persistent storage of decrypted values
    const [revealStates, setRevealStates] = useState<Map<string, SecretWithReveal>>(new Map());

    const toast = useToastHelpers();

    const [secretModal, setSecretModal] = useState<{
        isOpen: boolean;
        mode: "create" | "edit";
        secretData?: Secret & { decryptedValue?: string };
    }>({
        isOpen: false,
        mode: "create",
    });

    const [selectionModal, setSelectionModal] = useState<{
        isOpen: boolean;
        operation: "delete-secrets" | "copy-secrets";
    }>({
        isOpen: false,
        operation: "delete-secrets",
    });

    // Store hooks
    const { boxes, loadBoxes } = useBoxStore();
    const { sessions } = useDevStore();
    const {
        boxSecrets,
        isLoading: secretsLoading,
        error: secretsError,
        loadSecretsByBox,
        createSecret,
        updateSecret,
        deleteSecret,
        revealSecretValue,
        copySecret,
        clearError: clearSecretsError
    } = useSecretStore();

    const {
        secretResults,
        isLoading: searchLoading,
        error: searchError,
        searchSecretsInBox,
        clearSearch,
        clearError: clearSearchError
    } = useSearchStore();

    // Get current box data
    useEffect(() => {
        const box = boxes.find(b => b.id === boxId);
        setCurrentBox(box || null);
    }, [boxes, boxId]);

    // Load secrets for this box
    useEffect(() => {
        loadSecretsByBox(boxId);
        // Clear all reveal states when box changes
        setRevealStates(new Map());
    }, [boxId, loadSecretsByBox]);

    // Handle search
    useEffect(() => {
        if (searchQuery.trim()) {
            searchSecretsInBox(boxId, searchQuery);
        } else {
            clearSearch();
        }
    }, [searchQuery, boxId, searchSecretsInBox, clearSearch]);

    // Get secrets to display with reveal states
    const getSecretsWithRevealStates = (): SecretWithReveal[] => {
        const baseSecrets = searchQuery.trim()
            ? (secretResults || [])
            : (boxSecrets.get(boxId) || []);

        return baseSecrets.map(secret => {
            const revealState = revealStates.get(secret.id);
            return {
                ...secret,
                isRevealed: revealState?.isRevealed || false,
                decryptedValue: revealState?.decryptedValue,
                isDecrypting: revealState?.isDecrypting || false,
            };
        });
    };

    const secretsToDisplay = getSecretsWithRevealStates();
    const isLoading = secretsLoading || searchLoading;
    const error = secretsError || searchError;

    // Check if box has active dev session
    const hasActiveSession = () => {
        if (!currentBox) return false;
        return sessions.some(session =>
            session.box_name === currentBox.name && session.is_active
        );
    };

    const getActiveSession = () => {
        if (!currentBox) return null;
        return sessions.find(session =>
            session.box_name === currentBox.name && session.is_active
        ) || null;
    };

    // Helper functions for keyboard navigation
    const getFocusedSecret = () => {
        if (focusedSecretIndex >= 0 && focusedSecretIndex < secretsToDisplay.length) {
            return secretsToDisplay[focusedSecretIndex];
        }
        return null;
    };

    const blockKeyboardActionIfActive = (action: string) => {
        const activeSession = getActiveSession();

        if (activeSession) {
            toast.error('Box in dev session', `Stop the "${activeSession.session_name}" session first to ${action}`);
            return true;
        }
        return false;
    };

    // Initialize focus when secrets change
    useEffect(() => {
        if (secretsToDisplay.length > 0 && focusedSecretIndex === -1) {
            setFocusedSecretIndex(0);
        } else if (focusedSecretIndex >= secretsToDisplay.length) {
            setFocusedSecretIndex(Math.max(0, secretsToDisplay.length - 1));
        }
    }, [secretsToDisplay.length, focusedSecretIndex]);

    // Auto-scroll focused secret into view
    useEffect(() => {
        if (focusedSecretIndex >= 0 && focusedSecretIndex < secretsToDisplay.length) {
            const focusedElement = document.querySelector(`[data-secret-index="${focusedSecretIndex}"]`);
            if (focusedElement) {
                focusedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [focusedSecretIndex]);

    // Navigation functions
    const moveFocus = useCallback((direction: 'up' | 'down') => {
        if (secretsToDisplay.length === 0) return;

        setFocusedSecretIndex(prevIndex => {
            if (direction === 'up') {
                return prevIndex <= 0 ? secretsToDisplay.length - 1 : prevIndex - 1;
            } else {
                return prevIndex >= secretsToDisplay.length - 1 ? 0 : prevIndex + 1;
            }
        });
    }, [secretsToDisplay.length]);

    // Toggle search focus
    const toggleSearchFocus = useCallback(() => {
        if (searchInputRef.current) {
            if (document.activeElement === searchInputRef.current) {
                searchInputRef.current.blur();
            } else {
                searchInputRef.current.focus();
            }
        }
    }, []);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'n',
                callback: () => {
                    console.log('Opening secret creation modal...');
                    if (!blockKeyboardActionIfActive('create secrets in')) {
                        handleCreateSecret();
                    }
                },
                description: 'Create new secret'
            },
            {
                key: '/',
                callback: toggleSearchFocus,
                description: 'Toggle search focus'
            },
            {
                key: 'Delete',
                callback: () => {
                    console.log('Opening delete secrets modal...');
                    setSelectionModal({ isOpen: true, operation: "delete-secrets" });
                    setShowMenu(false);
                },
                description: 'Delete secrets (bulk)'
            },
            {
                key: 't',
                callback: () => {
                    console.log('Opening copy secrets modal...');
                    setSelectionModal({ isOpen: true, operation: "copy-secrets" });
                    setShowMenu(false);
                },
                description: 'Copy secrets to another box'
            },
            {
                key: 'Escape',
                callback: () => {
                    // Hierarchical escape: close menus first, then go back
                    if (showMenu) {
                        setShowMenu(false);
                    } else {
                        onNavigateBack();
                    }
                },
                description: 'Go back or close menus'
            },
            {
                key: 'ArrowUp',
                callback: () => moveFocus('up'),
                description: 'Navigate up'
            },
            {
                key: 'ArrowDown',
                callback: () => moveFocus('down'),
                description: 'Navigate down'
            },
            {
                key: 'Enter',
                callback: () => {
                    const focusedSecret = getFocusedSecret();
                    if (focusedSecret) {
                        handleRevealSecret(focusedSecret);
                    }
                },
                description: 'Reveal/hide focused secret'
            },
            {
                key: 'c',
                callback: () => {
                    const focusedSecret = getFocusedSecret();
                    if (focusedSecret) {
                        handleCopySecret(focusedSecret);
                    }
                },
                description: 'Copy focused secret'
            },
            {
                key: 'e',
                callback: () => {
                    const focusedSecret = getFocusedSecret();
                    if (focusedSecret && !blockKeyboardActionIfActive('edit secrets in')) {
                        handleEditSecret(focusedSecret);
                    }
                },
                description: 'Edit focused secret'
            },
            // Secure delete - requires Shift+D
            {
                key: 'd',
                shift: true,
                callback: () => {
                    const focusedSecret = getFocusedSecret();
                    if (focusedSecret && !blockKeyboardActionIfActive('delete secrets from')) {
                        handleDeleteSecret(focusedSecret);
                    }
                },
                description: 'Delete focused secret (Shift+D)'
            }
        ],
        enabled: !secretModal.isOpen && !selectionModal.isOpen // Disable when modals are open
    });

    // Define shortcuts for tooltip
    const shortcuts = [
        { key: 'N', description: 'Create secret' },
        { key: '/', description: 'Toggle search focus' },
        { key: '↑↓', description: 'Navigate secrets' },
        { key: 'Enter', description: 'Reveal/hide focused secret' },
        { key: 'C', description: 'Copy focused secret' },
        { key: 'E', description: 'Edit focused secret' },
        { key: 'Shift+D', description: 'Delete focused secret' },
        { key: 'Delete', description: 'Bulk delete secrets' },
        { key: 'T', description: 'Copy secrets to another box' },
        { key: 'Esc', description: 'Go back or close menus' }
    ];

    // Menu handlers
    const handleMenuOption = (option: "delete" | "copy") => {
        setShowMenu(false);
        if (option === "delete") {
            setSelectionModal({ isOpen: true, operation: "delete-secrets" });
        } else {
            setSelectionModal({ isOpen: true, operation: "copy-secrets" });
        }
    };

    const handleCreateSecret = () => {
        setSecretModal({
            isOpen: true,
            mode: "create",
        });
    };

    const handleEditSecret = (secret: SecretWithReveal) => {
        setSecretModal({
            isOpen: true,
            mode: "edit",
            secretData: { ...secret }
        });
    };

    const handleDeleteSecret = async (secret: SecretWithReveal) => {
        try {
            await deleteSecret(secret.id);
            toast.success("Secret deleted", `"${secret.name}" has been removed`);
            await loadSecretsByBox(boxId);
            await loadBoxes(); // Update box stats

            // Remove reveal state when secret is deleted
            setRevealStates(prev => {
                const newMap = new Map(prev);
                newMap.delete(secret.id);
                return newMap;
            });
        } catch (error) {
            toast.error("Delete failed", error instanceof Error ? error.message : "Failed to delete secret");
        }
    };

    const handleRevealSecret = async (secret: SecretWithReveal) => {
        if (secret.isRevealed) {
            // Hide the secret - clear reveal state
            setRevealStates(prev => {
                const newMap = new Map(prev);
                newMap.delete(secret.id); // Complete removal = garbage collection
                return newMap;
            });
            toast.success("Secret hidden", `"${secret.name}" is now hidden`);
            return;
        }

        // Show decrypting state
        setRevealStates(prev => new Map(prev).set(secret.id, {
            ...secret,
            isRevealed: false,
            isDecrypting: true,
        }));

        try {
            // Decrypt on-demand
            const decryptedValue = await revealSecretValue(secret.id);

            // Show immediately, then start cleanup timer
            setRevealStates(prev => new Map(prev).set(secret.id, {
                ...secret,
                isRevealed: true,
                decryptedValue: decryptedValue,
                isDecrypting: false,
            }));

            toast.success("Secret revealed!", `"${secret.name}" is now visible`);

            setTimeout(() => {
                setRevealStates(prev => {
                    const current = prev.get(secret.id);
                    if (current?.isRevealed) {
                        const newMap = new Map(prev);
                        newMap.delete(secret.id); // Auto-cleanup
                        return newMap;
                    }
                    return prev;
                });
            }, 30000); // 30 second auto-hide

        } catch (error) {
            setRevealStates(prev => {
                const newMap = new Map(prev);
                newMap.delete(secret.id);
                return newMap;
            });
            toast.error("Reveal failed", error instanceof Error ? error.message : "Failed to reveal secret");
        }
    };

    const handleCopySecret = async (secret: SecretWithReveal) => {
        try {
            // Always decrypt fresh for copy - never use cached values
            await copySecret(secret.id);
            toast.success("Copied to clipboard!", `"${secret.name}" value copied`);
        } catch (error) {
            toast.error("Copy failed", error instanceof Error ? error.message : "Failed to copy secret");
        }
    };

    const handleSecretModalSubmit = async (data: SecretFormData | Partial<SecretFormData>) => {
        try {
            if (secretModal.mode === "create") {
                await createSecret(boxId, data as SecretFormData);
                toast.success("Secret created!", `"${data.name}" has been added`);
                setSecretModal({ isOpen: false, mode: "create" });
                await loadSecretsByBox(boxId);
                await loadBoxes(); // Update box stats
            } else if (secretModal.secretData) {
                await updateSecret(secretModal.secretData.id, data as Partial<SecretFormData>);
                toast.success("Secret updated!", "Changes have been saved");
                setSecretModal({ isOpen: false, mode: "create" });
                await loadSecretsByBox(boxId);
                await loadBoxes(); // Update box stats

                setRevealStates(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(secretModal.secretData!.id);
                    return newMap;
                });
            }
        } catch (error) {
            toast.error("Failed to save secret", error instanceof Error ? error.message : "Operation failed");
            throw error;
        }
    };

    const handleSelectionModalClose = async () => {
        setSelectionModal({ isOpen: false, operation: "delete-secrets" });
        await loadSecretsByBox(boxId);
        await loadBoxes();
        setRevealStates(new Map());
    };

    const handleClearError = () => {
        clearSecretsError();
        clearSearchError();
    };

    const renderSecretCard = (secret: SecretWithReveal, index: number) => {
        const isFocused = focusedSecretIndex === index;

        return (
            <div
                key={secret.id}
                data-secret-index={index}
                className={`
                    relative transition-all duration-200
                    ${isFocused ? 'ring-2 ring-white ring-offset-2 ring-offset-black rounded-lg' : ''}
                `}
                onMouseEnter={() => setFocusedSecretIndex(index)}
            >
                <SecretCard
                    secret={secret}
                    isRevealed={secret.isRevealed}
                    decryptedValue={secret.decryptedValue}
                    onReveal={() => handleRevealSecret(secret)}
                    onCopy={() => handleCopySecret(secret)}
                    onEdit={() => handleEditSecret(secret)}
                    onDelete={() => handleDeleteSecret(secret)}
                    canModify={!hasActiveSession()}
                    isLoading={isLoading || secret.isDecrypting}
                />
            </div>
        );
    };

    if (!currentBox) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-6xl h-screen bg-black text-white flex items-center justify-center">
                    <div className="text-center">
                        <p className="text-white font-mono mb-3 sm:mb-4 text-sm sm:text-base">Box not found</p>
                        <Button variant="secondary" onClick={onNavigateBack}>
                            Go Back
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* 🎯 RESPONSIVE Container */}
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-full max-w-6xl h-screen bg-black text-white flex flex-col overflow-hidden">

                    {/* 🎯 RESPONSIVE Header */}
                    <header className="px-3 py-4 sm:px-4 sm:py-6 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            {/* 🎯 RESPONSIVE Box Info */}
                            <div className="flex items-center gap-2 sm:gap-3">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={ArrowLeft}
                                    onClick={onNavigateBack}
                                    title="Back to boxes"
                                />
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center">
                                    <BoxIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black" />
                                </div>
                                <div>
                                    <h1 className="text-sm sm:text-lg font-bold text-white font-mono">{currentBox.name}</h1>
                                    <p className="text-xs text-gray-400 font-mono">Secret Management</p>
                                </div>
                            </div>

                            {/* 🎯 RESPONSIVE Action Buttons */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* 🎯 RESPONSIVE Shortcuts Tooltip */}
                                <ShortcutsTooltip shortcuts={shortcuts} />

                                {/* 🎯 RESPONSIVE Menu */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Menu}
                                        onClick={() => setShowMenu(!showMenu)}
                                        title="Bulk operations"
                                    />

                                    {showMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                            <div className="absolute top-8 right-0 bg-black border-2 border-white rounded shadow-lg p-1.5 sm:p-2 z-20 min-w-40 sm:min-w-48">
                                                <button
                                                    onClick={() => handleMenuOption("delete")}
                                                    className="w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 rounded transition-colors text-left text-xs sm:text-sm font-mono text-red-400 hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    Delete Secrets
                                                </button>

                                                <button
                                                    onClick={() => handleMenuOption("copy")}
                                                    className="w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 rounded transition-colors text-left text-xs sm:text-sm font-mono text-blue-400 hover:bg-blue-900/20"
                                                >
                                                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    Copy To
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Plus}
                                    onClick={handleCreateSecret}
                                    title="Create secret (N)"
                                    disabled={hasActiveSession()}
                                />
                            </div>
                        </div>
                    </header>

                    {/* 🎯 RESPONSIVE Stats Bar */}
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-lg sm:text-xl font-bold text-white font-mono">{secretsToDisplay.length}</div>
                                <div className="text-xs text-gray-400 font-mono">Total Secrets</div>
                            </div>
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Search Bar */}
                    <div className="px-3 py-4 sm:px-4 sm:py-6 border-b border-gray-800 flex-shrink-0">
                        <div className="relative">
                            <div className="relative bg-black border-2 border-gray-600 rounded-lg hover:border-gray-400 transition-all duration-200 focus-within:border-white focus-within:shadow-lg focus-within:shadow-gray-400/20">
                                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search secrets by name... (/)"
                                    className="w-full pl-10 pr-3 py-2.5 sm:pl-12 sm:pr-4 sm:py-3 bg-transparent text-white placeholder-gray-400 outline-none font-mono text-xs sm:text-sm"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    autoCapitalize="off"
                                    spellCheck={false}
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs sm:text-sm font-mono transition-colors"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Main Content */}
                    <main className="flex-1 min-h-0 overflow-y-auto custom-scrollbar px-3 py-4 sm:px-4 sm:py-6">
                        {/* 🎯 RESPONSIVE Loading */}
                        {isLoading && (
                            <div className="text-center py-6 sm:py-8">
                                <div className="w-6 h-6 sm:w-8 sm:h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
                                <div className="text-white font-mono text-sm sm:text-base">Loading...</div>
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Empty State */}
                        {!isLoading && secretsToDisplay.length === 0 && (
                            <div className="text-center py-12 sm:py-16">
                                <Key className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 font-mono">No Secrets</h3>
                                <p className="text-gray-400 mb-4 sm:mb-6 font-mono text-sm sm:text-base">
                                    {searchQuery.trim()
                                        ? `No secrets found for "${searchQuery}"`
                                        : "Create your first secret in this box"
                                    }
                                </p>
                                {!searchQuery.trim() && !hasActiveSession() ? (
                                    <Button
                                        variant="primary"
                                        size="lg"
                                        onClick={handleCreateSecret}
                                        className="mx-auto"
                                    >
                                        Create Secret (N)
                                    </Button>
                                ) : searchQuery.trim() ? (
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={() => setSearchQuery("")}
                                        className="mx-auto"
                                    >
                                        Clear Search
                                    </Button>
                                ) : (
                                    <p className="text-amber-400 text-xs sm:text-sm font-mono">
                                        Box is in dev session - stop session to create secrets
                                    </p>
                                )}
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Secrets Grid */}
                        {!isLoading && secretsToDisplay.length > 0 && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                                {secretsToDisplay.map((secret, index) => renderSecretCard(secret, index))}
                            </div>
                        )}
                    </main>

                    {/* 🎯 RESPONSIVE Error Display */}
                    {error && (
                        <div className="p-3 sm:p-4 bg-red-900/20 border-t border-red-500 flex-shrink-0">
                            <div className="flex items-center justify-between">
                                <p className="text-red-400 text-xs sm:text-sm font-mono">{error}</p>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClearError}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            <SecretModal
                isOpen={secretModal.isOpen}
                mode={secretModal.mode}
                initialData={secretModal.secretData}
                onSubmit={handleSecretModalSubmit}
                onCancel={() => setSecretModal({ isOpen: false, mode: "create" })}
                isLoading={isLoading}
            />

            <SelectionModal
                isOpen={selectionModal.isOpen}
                operation={selectionModal.operation}
                currentBoxId={boxId}
                onClose={handleSelectionModalClose}
            />
        </>
    );
};