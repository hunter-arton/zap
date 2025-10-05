

// src/screens/HomeScreen.tsx - FULLY RESPONSIVE
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Settings, Lock, Box as BoxIcon, Menu, Trash2, FileText, Search, Plus, Upload } from "lucide-react";
import { Button } from "../components/Button";
import { SessionTimer } from "../components/SessionTimer";
import { BoxModal } from "../components/BoxModal";
import { SecretModal } from "../components/SecretModal";
import { BoxCard } from "../components/BoxCard";
import { SelectionModal } from "../components/SelectionModal";
import { ActiveSessionsBanner } from "../components/ActiveSessionsBanner";
import { ActiveSessionModal } from "../components/ActiveSessionModal";
import { ShortcutsTooltip } from "../components/ShortcutsTooltip";
import { useToastHelpers } from "../components";
import { useBoxStore, useAuthStore, useSecretStore, useDevStore, useImportExportStore } from "../stores";
import { useKeyboardShortcuts } from "../hooks/useKeyboard";
import type { Box, BoxFormData, SecretFormData } from "../types";

interface HomeScreenProps {
    onOpenSettings: () => void;
    onNavigateToBox: (boxId: string) => void;
    onOpenLogs?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
    onOpenSettings,
    onNavigateToBox,
    onOpenLogs,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [showBulkMenu, setShowBulkMenu] = useState(false);
    const [showActiveSessionModal, setShowActiveSessionModal] = useState(false);
    const [focusedBoxIndex, setFocusedBoxIndex] = useState<number>(-1);
    const [isDraggingVault, setIsDraggingVault] = useState(false);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const vaultFileInputRef = useRef<HTMLInputElement>(null);

    const [modal, setModal] = useState<{
        type: 'box' | 'secret' | 'bulk' | null;
        mode?: 'create' | 'edit' | 'delete';
        data?: any;
    }>({ type: null });

    const toast = useToastHelpers();

    // Store hooks
    const { boxes, isLoading, loadBoxes, createBox, updateBox, deleteBox } = useBoxStore();
    const { lock } = useAuthStore();
    const { createSecret } = useSecretStore();
    const { sessions, totalSessions, loadAllSessions, stopSession } = useDevStore();
    const { exportBoxAsEnv, importEnvToBox, importVault } = useImportExportStore();

    // Load data on mount
    useEffect(() => {
        loadBoxes();
        loadAllSessions();
    }, [loadBoxes, loadAllSessions]);

    // Helper to check if box has active session
    const hasActiveSession = (box: Box) => {
        return sessions.some(session =>
            session.box_name === box.name && session.is_active
        );
    };

    // Smart box sorting with active sessions pinned to top
    const getSortedBoxes = (boxesToSort: Box[]) => {
        return [...boxesToSort].sort((a, b) => {
            const aHasSession = hasActiveSession(a);
            const bHasSession = hasActiveSession(b);

            if (aHasSession && !bHasSession) return -1;
            if (!aHasSession && bHasSession) return 1;

            return b.created_at - a.created_at;
        });
    };

    // Apply search filtering and sorting
    const filteredAndSortedBoxes = (() => {
        const searchFiltered = searchQuery.trim()
            ? boxes.filter(box =>
                box.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                box.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                box.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            : boxes;

        return getSortedBoxes(searchFiltered);
    })();

    // Grid navigation calculations
    const getGridColumns = () => {
        if (window.innerWidth >= 1280) return 3; // xl
        if (window.innerWidth >= 768) return 2;  // md
        return 1;
    };

    const getGridPosition = (index: number) => {
        const cols = getGridColumns();
        return {
            row: Math.floor(index / cols),
            col: index % cols
        };
    };

    const getIndexFromPosition = (row: number, col: number) => {
        const cols = getGridColumns();
        const index = row * cols + col;
        return index < filteredAndSortedBoxes.length ? index : -1;
    };

    // Keyboard navigation
    const moveFocus = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        if (filteredAndSortedBoxes.length === 0) return;

        const cols = getGridColumns();
        const currentPos = focusedBoxIndex >= 0 ? getGridPosition(focusedBoxIndex) : { row: 0, col: 0 };
        let newRow = currentPos.row;
        let newCol = currentPos.col;

        switch (direction) {
            case 'up':
                newRow = Math.max(0, currentPos.row - 1);
                break;
            case 'down':
                newRow = Math.min(Math.floor((filteredAndSortedBoxes.length - 1) / cols), currentPos.row + 1);
                break;
            case 'left':
                if (currentPos.col > 0) {
                    newCol = currentPos.col - 1;
                } else if (currentPos.row > 0) {
                    newRow = currentPos.row - 1;
                    newCol = Math.min(cols - 1, (filteredAndSortedBoxes.length - 1) % cols);
                }
                break;
            case 'right':
                if (currentPos.col < cols - 1 && getIndexFromPosition(currentPos.row, currentPos.col + 1) !== -1) {
                    newCol = currentPos.col + 1;
                } else if (getIndexFromPosition(currentPos.row + 1, 0) !== -1) {
                    newRow = currentPos.row + 1;
                    newCol = 0;
                }
                break;
        }

        const newIndex = getIndexFromPosition(newRow, newCol);
        if (newIndex >= 0 && newIndex < filteredAndSortedBoxes.length) {
            setFocusedBoxIndex(newIndex);
        }
    }, [filteredAndSortedBoxes.length, focusedBoxIndex]);

    // Initialize focus when boxes change
    useEffect(() => {
        if (filteredAndSortedBoxes.length > 0 && focusedBoxIndex === -1) {
            setFocusedBoxIndex(0);
        } else if (focusedBoxIndex >= filteredAndSortedBoxes.length) {
            setFocusedBoxIndex(Math.max(0, filteredAndSortedBoxes.length - 1));
        }
    }, [filteredAndSortedBoxes.length, focusedBoxIndex]);

    // Helper to get focused box and check if it has active session
    const getFocusedBox = () => {
        if (focusedBoxIndex >= 0 && focusedBoxIndex < filteredAndSortedBoxes.length) {
            return filteredAndSortedBoxes[focusedBoxIndex];
        }
        return null;
    };

    const getFocusedBoxSession = () => {
        const focusedBox = getFocusedBox();
        if (!focusedBox) return null;
        return sessions.find(session => session.box_name === focusedBox.name && session.is_active) || null;
    };

    const blockKeyboardActionIfActive = (action: string) => {
        const focusedBox = getFocusedBox();
        const activeSession = getFocusedBoxSession();

        if (focusedBox && activeSession) {
            toast.error('Box in dev session', `Stop the "${activeSession.session_name}" session first to ${action}`);
            return true;
        }
        return false;
    };

    // Auto-scroll focused box into view
    useEffect(() => {
        if (focusedBoxIndex >= 0 && focusedBoxIndex < filteredAndSortedBoxes.length) {
            const focusedElement = document.querySelector(`[data-box-index="${focusedBoxIndex}"]`);
            if (focusedElement) {
                focusedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                    inline: 'nearest'
                });
            }
        }
    }, [focusedBoxIndex]);

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

    // Dev session toggle for focused box
    const toggleFocusedBoxSession = useCallback(async () => {
        const focusedBox = getFocusedBox();
        const activeSession = getFocusedBoxSession();

        if (!focusedBox) return;

        if (!focusedBox.dev_mode) {
            toast.info("Not a dev box", "Enable dev mode to use sessions");
            return;
        }

        if (activeSession) {
            // Stop session
            try {
                await stopSession(activeSession.session_name);
                loadAllSessions();
                loadBoxes();
                toast.success("Session stopped", "Dev session has been ended");
            } catch (error) {
                toast.error("Failed to stop session", "Please try again");
            }
        } else {
            // Start session - show info for now
            toast.info("Start dev session", "Use the play button to start a session");
        }
    }, [getFocusedBox, getFocusedBoxSession, stopSession, loadAllSessions, loadBoxes, toast]);

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'b',
                callback: () => {
                    console.log('Opening box creation modal...');
                    openBoxModal('create');
                },
                description: 'Create new box'
            },
            {
                key: 'n',
                callback: () => {
                    console.log('Opening secret creation modal...');
                    const focusedBox = getFocusedBox();
                    if (focusedBox && !blockKeyboardActionIfActive('add secrets to')) {
                        openSecretModal(focusedBox);
                    }
                },
                description: 'Create new secret in focused box'
            },
            {
                key: '/',
                callback: toggleSearchFocus,
                description: 'Toggle search focus'
            },
            {
                key: 'Delete',
                callback: () => {
                    console.log('Opening delete all modal...');
                    setModal({ type: 'bulk', mode: 'delete' });
                    setShowBulkMenu(false);
                },
                description: 'Delete boxes (bulk)'
            },
            {
                key: 'z',
                callback: toggleFocusedBoxSession,
                description: 'Start/stop dev session'
            },
            {
                key: 'Escape',
                callback: () => {
                    // Hierarchical escape: close menus first, then logout
                    if (showBulkMenu) {
                        setShowBulkMenu(false);
                    } else if (showActiveSessionModal) {
                        setShowActiveSessionModal(false);
                    } else {
                        // No modals open, lock the vault
                        handleLockVault();
                    }
                },
                description: 'Close menus or lock vault'
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
                key: 'ArrowLeft',
                callback: () => moveFocus('left'),
                description: 'Navigate left'
            },
            {
                key: 'ArrowRight',
                callback: () => moveFocus('right'),
                description: 'Navigate right'
            },
            {
                key: 'Enter',
                callback: () => {
                    const focusedBox = getFocusedBox();
                    if (focusedBox && !blockKeyboardActionIfActive('access this box')) {
                        handleBoxClick(focusedBox);
                    }
                },
                description: 'Open focused box'
            },
            {
                key: 'e',
                callback: () => {
                    const focusedBox = getFocusedBox();
                    if (focusedBox && !blockKeyboardActionIfActive('edit')) {
                        openBoxModal('edit', focusedBox);
                    }
                },
                description: 'Edit focused box'
            },
            // Secure delete - requires Shift+D
            {
                key: 'd',
                shift: true,
                callback: () => {
                    const focusedBox = getFocusedBox();
                    if (focusedBox && !blockKeyboardActionIfActive('delete')) {
                        handleBoxDelete(focusedBox);
                    }
                },
                description: 'Delete focused box (Shift+D)'
            }
        ],
        enabled: modal.type === null // Disable when modals are open
    });

    // Define shortcuts for tooltip
    const shortcuts = [
        { key: 'B', description: 'Create box' },
        { key: 'N', description: 'Create secret in focused box' },
        { key: '/', description: 'Toggle search focus' },
        { key: '↑↓←→', description: 'Navigate boxes' },
        { key: 'Enter', description: 'Open focused box' },
        { key: 'E', description: 'Edit focused box' },
        { key: 'Shift+D', description: 'Delete focused box' },
        { key: 'Z', description: 'Start/stop dev session' },
        { key: 'Delete', description: 'Bulk delete boxes' },
        { key: 'Esc', description: 'Close menus or logout' }
    ];

    // Utility functions
    const downloadFile = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const generateFileName = (boxName: string) => {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
        const safeName = boxName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        return `${safeName}--${timestamp}.env`;
    };

    const openBoxModal = (mode: 'create' | 'edit', box?: Box) => {
        setModal({ type: 'box', mode, data: box });
    };

    const openSecretModal = (box: Box) => {
        setModal({ type: 'secret', mode: 'create', data: { boxId: box.id, boxName: box.name } });
    };

    const closeModal = () => {
        setModal({ type: null });
    };

    // Block operation if box has active session
    const blockIfActive = (box: Box, action: string) => {
        if (hasActiveSession(box)) {
            toast.error('Box in dev session', `Stop the session first to ${action}`);
            return true;
        }
        return false;
    };

    const handleBoxClick = (box: Box) => {
        if (!blockIfActive(box, 'access this box')) {
            onNavigateToBox(box.id);
        }
    };

    const handleBoxImport = async (box: Box, file: File) => {
        if (blockIfActive(box, 'import files')) return;

        try {
            if (!file.name.toLowerCase().endsWith('.env')) {
                toast.error("Unsupported file type", "Only .ENV files are supported");
                return;
            }

            if (file.size > 1024 * 1024) {
                toast.error("File too large", "Please select a .env file smaller than 1MB");
                return;
            }

            const envContent = await file.text();
            if (!envContent.trim()) {
                toast.error("Empty file", "The .env file contains no data");
                return;
            }

            const result = await importEnvToBox(envContent, box.id);
            await loadBoxes();

            if (result.secrets_imported > 0) {
                toast.success("Import successful!", `${result.secrets_imported} secrets imported`);
            }
            if (result.errors.length > 0) {
                toast.error("Some imports failed", `${result.errors.length} errors occurred`);
            }
        } catch (error) {
            toast.error("Import failed", error instanceof Error ? error.message : "Failed to import file");
        }
    };

    const handleBoxExport = async (box: Box) => {
        if (blockIfActive(box, 'export')) return;

        try {
            const envData = await exportBoxAsEnv(box.id);
            const filename = generateFileName(box.name);
            downloadFile(envData, filename);
            toast.success("Export complete!", `Exported as ${filename}`);
        } catch (error) {
            toast.error("Export failed", error instanceof Error ? error.message : "Failed to export");
        }
    };

    const handleBoxDelete = async (box: Box) => {
        if (blockIfActive(box, 'delete')) return;

        try {
            await deleteBox(box.id);
            toast.success("Box deleted", "Box and all secrets have been removed");
        } catch (error) {
            toast.error("Delete failed", error instanceof Error ? error.message : "Failed to delete box");
        }
    };

    // Vault import handlers
    const handleVaultDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!isDraggingVault && !isLoading) {
            setIsDraggingVault(true);
        }
    };

    const handleVaultDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingVault(false);
    };

    const handleVaultDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDraggingVault(false);

        if (isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        const jsonFile = files.find(file => file.name.toLowerCase().endsWith('.json'));

        if (!jsonFile) {
            toast.error('Unsupported file type', 'Only .JSON vault files are supported');
            return;
        }

        handleVaultImport(jsonFile);
    };

    const handleVaultImport = async (file: File) => {
        try {
            if (!file.name.toLowerCase().endsWith('.json')) {
                toast.error("Unsupported file type", "Only .JSON vault files are supported");
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("File too large", "Please select a vault file smaller than 5MB");
                return;
            }

            const jsonContent = await file.text();
            if (!jsonContent.trim()) {
                toast.error("Empty file", "The vault file contains no data");
                return;
            }

            const result = await importVault(jsonContent);
            await loadBoxes();

            if (result.boxes_imported > 0) {
                toast.success("Vault imported!", `${result.boxes_imported} boxes imported successfully`);
            }
            if (result.errors.length > 0) {
                toast.error("Some imports failed", `${result.errors.length} errors occurred`);
            }
        } catch (error) {
            toast.error("Import failed", error instanceof Error ? error.message : "Failed to import vault");
        }
    };

    const handleVaultFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        handleVaultImport(file);
        e.target.value = '';
    };

    // Session handlers  
    const handleSessionStarted = () => {
        loadAllSessions();
        loadBoxes();
        toast.success("Dev session started!", "Session is now active");
    };

    const handleSessionStopped = () => {
        loadAllSessions();
        loadBoxes();
        toast.success("Session stopped", "Dev session has been ended");
    };

    const handleLockVault = async () => {
        try {
            await lock();
            toast.success("Vault locked", "Your vault has been securely locked");
        } catch (error) {
            toast.error("Failed to lock vault", "Please try again");
        }
    };

    const handleBoxModalSubmit = async (data: BoxFormData | Partial<BoxFormData>) => {
        try {
            if (modal.mode === "create") {
                await createBox(data as BoxFormData);
                toast.success("Box created!", `"${data.name}" is ready to use`);
                closeModal();
            } else if (modal.mode === "edit" && modal.data) {
                if (blockIfActive(modal.data, 'edit')) return;

                await updateBox(modal.data.id, data);
                toast.success("Box updated", "Changes have been saved");
                closeModal();
            }
        } catch (error) {
            toast.error("Failed to save box", error instanceof Error ? error.message : "Operation failed");
        }
    };

    const handleSecretModalSubmit = async (data: SecretFormData | Partial<SecretFormData>) => {
        try {
            if (!data.name || !data.value) {
                throw new Error("Missing required secret data");
            }

            const completeData: SecretFormData = {
                name: data.name,
                value: data.value,
            };

            await createSecret(modal.data.boxId, completeData);
            await loadBoxes();
            toast.success("Secret created!", `"${data.name}" has been added`);
            closeModal();
        } catch (error) {
            toast.error("Failed to create secret", error instanceof Error ? error.message : "Operation failed");
        }
    };

    const renderBoxCard = (box: Box, index: number) => {
        const activeSession = sessions.find(
            session => session.box_name === box.name && session.is_active
        ) || null;

        const isFocused = focusedBoxIndex === index;

        return (
            <div
                key={box.id}
                data-box-index={index}
                className={`
                    relative transition-all duration-200
                    ${isFocused ? 'ring-2 ring-white ring-offset-2 ring-offset-black rounded-lg' : ''}
                `}
                onMouseEnter={() => setFocusedBoxIndex(index)}
            >
                <BoxCard
                    box={box}
                    activeSession={activeSession}
                    onAddSecret={() => {
                        if (!blockIfActive(box, 'add secrets')) {
                            openSecretModal(box);
                        }
                    }}
                    onSessionStarted={handleSessionStarted}
                    onSessionStopped={handleSessionStopped}
                    onEdit={() => {
                        if (!blockIfActive(box, 'edit')) {
                            openBoxModal('edit', box);
                        }
                    }}
                    onDelete={() => handleBoxDelete(box)}
                    onImport={(file) => handleBoxImport(box, file)}
                    onExport={() => handleBoxExport(box)}
                    onBoxClick={() => handleBoxClick(box)}
                    onShowToast={(type, title, message) => {
                        const toastHelpers = {
                            success: toast.success,
                            error: toast.error,
                            warning: toast.warning,
                            info: toast.info
                        };
                        toastHelpers[type](title, message);
                    }}
                    isLoading={isLoading}
                />
            </div>
        );
    };

    return (
        <>
            {/* 🎯 RESPONSIVE iPad-like Container */}
            <div className="min-h-screen bg-black">
                <div className="relative w-full max-w-6xl h-screen bg-black text-white flex flex-col overflow-hidden mx-auto">

                    {/* 🎯 RESPONSIVE Header */}
                    <header className="px-3 py-4 sm:px-4 sm:py-6 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <img
                                    src="/logo.svg"
                                    alt="Zap Logo"
                                    className="w-6 h-6 sm:w-8 sm:h-8"
                                />
                                <div>
                                    <h1 className="text-sm sm:text-lg font-bold text-white font-mono">Zap</h1>
                                    <p className="text-xs text-gray-400 font-mono">Secure Vault</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {/* 🎯 RESPONSIVE Session Timer - Now visible on mobile */}
                                <SessionTimer />

                                {/* 🎯 RESPONSIVE Shortcuts Tooltip */}
                                <ShortcutsTooltip shortcuts={shortcuts} />

                                {/* 🎯 RESPONSIVE Menu */}
                                <div className="relative">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        icon={Menu}
                                        onClick={() => setShowBulkMenu(!showBulkMenu)}
                                        title="More options"
                                    />

                                    {showBulkMenu && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setShowBulkMenu(false)} />
                                            <div className="absolute top-8 right-0 bg-black border-2 border-white rounded shadow-lg p-1.5 sm:p-2 z-20 min-w-40 sm:min-w-48">
                                                <button
                                                    onClick={() => {
                                                        if (onOpenLogs) {
                                                            onOpenLogs();
                                                            setShowBulkMenu(false);
                                                        }
                                                    }}
                                                    className="w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 rounded transition-colors text-left text-xs sm:text-sm font-mono text-blue-400 hover:bg-blue-900/20"
                                                >
                                                    <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    View Logs
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setModal({ type: 'bulk', mode: 'delete' });
                                                        setShowBulkMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 sm:gap-3 px-2 py-1.5 sm:px-3 sm:py-2 rounded transition-colors text-left text-xs sm:text-sm font-mono text-red-400 hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                                                    Delete Boxes
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Settings}
                                    onClick={onOpenSettings}
                                    title="Settings"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Lock}
                                    onClick={handleLockVault}
                                    title="Lock Vault"
                                />
                            </div>
                        </div>
                    </header>

                    {/* 🎯 RESPONSIVE Active Sessions Banner */}
                    <ActiveSessionsBanner
                        sessionCount={totalSessions}
                        onClick={() => setShowActiveSessionModal(true)}
                    />

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
                                    placeholder="Search boxes by name, description, or tags... (/)"
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
                        {!isLoading && filteredAndSortedBoxes.length === 0 && (
                            <div
                                className={`
                                    text-center py-12 sm:py-16 relative transition-all duration-200
                                    ${isDraggingVault ? 'bg-blue-950/30 border-2 border-dashed border-blue-400 rounded-lg' : ''}
                                `}
                                onDragOver={handleVaultDragOver}
                                onDragLeave={handleVaultDragLeave}
                                onDrop={handleVaultDrop}
                            >
                                <input
                                    ref={vaultFileInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleVaultFileSelect}
                                    className="hidden"
                                />

                                {isDraggingVault && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                                        <div className="text-blue-100 text-sm font-mono text-center bg-blue-900/90 px-4 py-3 rounded border border-blue-400">
                                            <Upload className="w-6 h-6 mx-auto mb-2" />
                                            Drop vault file (.json)
                                        </div>
                                    </div>
                                )}

                                <BoxIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 font-mono">No Boxes</h3>
                                <p className="text-gray-400 mb-4 sm:mb-6 font-mono text-sm sm:text-base">
                                    {searchQuery ? `No boxes found for "${searchQuery}"` : "Create your first box or import an existing vault"}
                                </p>
                                {!searchQuery && (
                                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center justify-center">
                                        <Button
                                            variant="primary"
                                            size="lg"
                                            onClick={() => openBoxModal('create')}
                                        >
                                            Create Box (B)
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="lg"
                                            onClick={() => vaultFileInputRef.current?.click()}
                                        >
                                            Import Vault
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Grid */}
                        {!isLoading && filteredAndSortedBoxes.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                                {filteredAndSortedBoxes.map((box, index) => renderBoxCard(box, index))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* 🎯 RESPONSIVE FAB */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
                <Button
                    variant="primary"
                    size="lg"
                    icon={Plus}
                    onClick={() => openBoxModal('create')}
                    circular
                    className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-12 h-12 sm:w-14 sm:h-14"
                    title="Create Box (B)"
                />
            </div>

            {/* Modals */}
            {modal.type === 'box' && (
                <BoxModal
                    isOpen={true}
                    mode={modal.mode as 'create' | 'edit'}
                    initialData={modal.data}
                    onSubmit={handleBoxModalSubmit}
                    onCancel={closeModal}
                    isLoading={isLoading}
                />
            )}

            {modal.type === 'secret' && (
                <SecretModal
                    isOpen={true}
                    mode="create"
                    onSubmit={handleSecretModalSubmit}
                    onCancel={closeModal}
                    isLoading={isLoading}
                />
            )}

            {modal.type === 'bulk' && (
                <SelectionModal
                    isOpen={true}
                    operation='delete-boxes'
                    onClose={() => {
                        closeModal();
                        loadBoxes();
                    }}
                />
            )}

            <ActiveSessionModal
                isOpen={showActiveSessionModal}
                onClose={() => setShowActiveSessionModal(false)}
                onSessionStopped={handleSessionStopped}
            />
        </>
    );
};