
// src/components/BoxCard.tsx - FULLY RESPONSIVE
import React, { useState, useRef, useCallback } from "react";
import { Box, Info, Plus, Play, Square, Code, MoreVertical, Edit, Trash2, Upload, Download } from "lucide-react";
import { Button } from "./Button";
import { DevSessionModal } from "./DevSessionModal";
import { useDevStore } from "../stores";
import { formatDate, truncateName } from "../utils";
import type { Box as BoxType, ActiveSessionInfo } from "../types";

interface BoxCardProps {
    box: BoxType;
    activeSession?: ActiveSessionInfo | null;
    onAddSecret: () => void;
    onSessionStarted?: () => void;
    onSessionStopped?: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onImport: (file: File) => void;
    onExport: () => void;
    onBoxClick: () => void;
    onShowToast: (type: 'error' | 'success' | 'warning' | 'info', title: string, message?: string) => void;
    isLoading?: boolean;
}

export const BoxCard: React.FC<BoxCardProps> = ({
    box,
    activeSession,
    onAddSecret,
    onSessionStarted,
    onSessionStopped,
    onEdit,
    onDelete,
    onImport,
    onExport,
    onBoxClick,
    onShowToast,
    isLoading = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [showAllTags, setShowAllTags] = useState(false);
    const [showSessionModal, setShowSessionModal] = useState(false);
    const [isStoppingSession, setIsStoppingSession] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const { stopSession } = useDevStore();

    const hasActiveSession = activeSession?.session_name &&
        activeSession.box_name === box.name &&
        activeSession.is_active;

    const anySessionActive = activeSession?.is_active || false;
    const canStartSession = box.dev_mode && !anySessionActive;

    // Block all operations if session is active
    const blockOperation = (actionName: string) => {
        if (hasActiveSession) {
            onShowToast('error', 'Box in dev session', `Stop the session first to ${actionName}`);
            return true;
        }
        return false;
    };

    // Drag handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if (!hasActiveSession && !isDragging && !isLoading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        if (blockOperation('import files')) return;
        if (isLoading) return;

        const files = Array.from(e.dataTransfer.files);
        const envFile = files.find(file => file.name.toLowerCase().endsWith('.env'));

        if (!envFile) {
            onShowToast('error', 'Unsupported file type', 'Only .ENV files are supported');
            return;
        }

        if (envFile.size > 1024 * 1024) {
            onShowToast('error', 'File too large', 'Please select a .env file smaller than 1MB');
            return;
        }

        onImport(envFile);
    };

    const handleStartSession = useCallback(() => {
        if (canStartSession && !isLoading) {
            setShowSessionModal(true);
        }
    }, [canStartSession, isLoading]);

    const handleStopSession = useCallback(async () => {
        if (hasActiveSession && activeSession && !isLoading && !isStoppingSession) {
            setIsStoppingSession(true);
            try {
                await stopSession(activeSession.session_name);
                if (onSessionStopped) onSessionStopped();
            } catch (error) {
                onShowToast('error', 'Failed to stop session', 'Please try again');
            } finally {
                setIsStoppingSession(false);
            }
        }
    }, [hasActiveSession, activeSession, isLoading, isStoppingSession, stopSession, onSessionStopped, onShowToast]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.toLowerCase().endsWith('.env')) {
            onShowToast('error', 'Unsupported file type', 'Only .ENV files are supported');
        } else {
            onImport(file);
        }
        e.target.value = '';
    }, [onImport, onShowToast]);

    const handleCardClick = useCallback((e: React.MouseEvent) => {
        if (isDragging) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        if (blockOperation('access this box')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        onBoxClick();
    }, [isDragging, hasActiveSession, onBoxClick]);

    const displayTags = box.tags.slice(0, 3);
    const hiddenTagsCount = Math.max(0, box.tags.length - 3);

    return (
        <>
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    group relative bg-black border-2 rounded-lg 
                    flex flex-col cursor-pointer
                    transition-all duration-200 ease-out
                    ${hasActiveSession
                        ? 'border-green-400 shadow-lg shadow-green-400/20'
                        : isDragging
                            ? 'border-blue-400 bg-blue-950/30 shadow-lg shadow-blue-400/20'
                            : 'border-gray-600 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/10'
                    }
                    ${isLoading ? 'opacity-75' : ''}
                    p-2 sm:p-4 min-h-[6rem] sm:min-h-[8rem]
                `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".env"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {isDragging && (
                    <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-400 rounded-lg flex items-center justify-center z-30 pointer-events-none">
                        <div className="text-blue-100 text-xs sm:text-sm font-mono text-center bg-blue-900/90 px-2 py-1 sm:px-3 sm:py-2 rounded border border-blue-400">
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mx-auto mb-1" />
                            Drop .env file
                        </div>
                    </div>
                )}

                {/* 🎯 RESPONSIVE Header */}
                <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0" onClick={handleCardClick}>
                        <Box className={`w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 transition-colors ${hasActiveSession ? 'text-green-400' : 'text-gray-400'}`} />
                        <h3 className="font-semibold text-white font-mono text-xs sm:text-sm truncate" title={box.name}>
                            {truncateName(box.name, 20)}
                        </h3>
                        {hasActiveSession && (
                            <span className="px-1.5 py-0.5 bg-green-900/40 border border-green-400/60 text-green-300 text-xs rounded font-mono font-medium">
                                ACTIVE
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1 sm:ml-2 relative z-10">
                        {/* 🎯 RESPONSIVE Description tooltip */}
                        {box.description && (
                            <div className="relative">
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    icon={Info}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowDescription(!showDescription);
                                    }}
                                    title="View description"
                                />
                                {showDescription && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setShowDescription(false)} />
                                        <div className="absolute top-6 right-0 bg-black border border-white rounded p-2 sm:p-3 z-20 max-w-48 sm:max-w-64 text-xs font-mono">
                                            <div className="text-white font-bold mb-1">Description:</div>
                                            <div className="text-gray-400">{box.description}</div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Add secret */}
                        <Button
                            variant="ghost"
                            size="xs"
                            icon={Plus}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!blockOperation('add secrets')) {
                                    onAddSecret();
                                }
                            }}
                            disabled={hasActiveSession || isLoading}
                            title={hasActiveSession ? "Stop session to add secrets" : "Add secret"}
                        />

                        {/* 🎯 RESPONSIVE Dev session control */}
                        {box.dev_mode && (
                            <Button
                                variant="ghost"
                                size="xs"
                                icon={hasActiveSession ? Square : Play}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    hasActiveSession ? handleStopSession() : handleStartSession();
                                }}
                                disabled={(!hasActiveSession && !canStartSession) || isLoading || isStoppingSession}
                                title={
                                    hasActiveSession ? "Stop dev session" :
                                        canStartSession ? "Start dev session" :
                                            "Another session is active"
                                }
                                className={hasActiveSession ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}
                            />
                        )}

                        {/* 🎯 RESPONSIVE Menu */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="xs"
                                icon={MoreVertical}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMenu(!showMenu);
                                }}
                                disabled={isLoading}
                                title="More actions"
                            />

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute top-6 right-0 bg-black border border-white rounded shadow-lg p-1 z-20 min-w-24 sm:min-w-28">
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                if (!blockOperation('edit')) onEdit();
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono text-white hover:bg-gray-800"
                                        >
                                            <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                if (!blockOperation('import to')) {
                                                    fileInputRef.current?.click();
                                                }
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono text-white hover:bg-gray-800"
                                        >
                                            <Upload className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Import
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                if (!blockOperation('export')) onExport();
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono text-white hover:bg-gray-800"
                                        >
                                            <Download className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Export
                                        </button>

                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                if (!blockOperation('delete')) onDelete();
                                            }}
                                            className="w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono text-red-400 hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* 🎯 RESPONSIVE Body */}
                <div className="flex items-center justify-between mb-2 sm:mb-3 min-h-[14px] sm:min-h-[20px]" onClick={handleCardClick}>
                    <p className="text-xs text-gray-400 font-mono">
                        {box.secrets_count} secret{box.secrets_count !== 1 ? 's' : ''}
                    </p>

                    <div className="relative flex items-center justify-end">
                        {box.tags.length > 0 && (
                            <div
                                className="flex gap-1.5"
                                onMouseEnter={() => hiddenTagsCount > 0 && setShowAllTags(true)}
                                onMouseLeave={() => setShowAllTags(false)}
                            >
                                {displayTags.map((tag) => (
                                    <span key={tag} className="px-1.5 py-0.5 bg-gray-800/80 border border-gray-600 text-gray-300 text-xs rounded font-mono">
                                        {tag}
                                    </span>
                                ))}
                                {hiddenTagsCount > 0 && (
                                    <span className="px-1.5 py-0.5 bg-gray-700/80 border border-gray-500 text-gray-400 text-xs rounded font-mono">
                                        +{hiddenTagsCount}
                                    </span>
                                )}
                            </div>
                        )}

                        {showAllTags && hiddenTagsCount > 0 && (
                            <div className="absolute top-5 right-0 bg-black border border-white rounded p-2 z-20 max-w-40 sm:max-w-48 text-xs font-mono">
                                <div className="text-white font-bold mb-1">All Tags:</div>
                                <div className="flex flex-wrap gap-1">
                                    {box.tags.map((tag) => (
                                        <span key={tag} className="text-gray-400">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 🎯 RESPONSIVE Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono mt-auto pt-1" onClick={handleCardClick}>
                    <div className="flex items-center">
                        {box.dev_mode && <Code className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-blue-400" />}
                    </div>
                    <span className="text-xs">{formatDate(box.created_at)}</span>
                </div>
            </div>

            <DevSessionModal
                isOpen={showSessionModal}
                boxId={box.id}
                boxName={box.name}
                onSuccess={() => {
                    setShowSessionModal(false);
                    if (onSessionStarted) onSessionStarted();
                }}
                onCancel={() => setShowSessionModal(false)}
            />
        </>
    );
};