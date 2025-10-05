// src/screens/LogsScreen.tsx - FULLY RESPONSIVE
import React, { useState, useEffect } from "react";
import {
    ArrowLeft,
    FileText,
    Download,
    Trash2,
    Activity,
    Search
} from "lucide-react";
import { Button } from "../components/Button";
import { PasswordModal } from "../components/PasswordModal";
import { useToastHelpers } from "../components";
import { useLogStore } from "../stores";
import { formatDate } from "../utils";
import { useKeyboardShortcuts } from "../hooks/useKeyboard";
import type { LogEntry } from "../types";

interface LogsScreenProps {
    onBack: () => void;
}

// 🎯 RESPONSIVE LogCard component
const LogCard: React.FC<{ log: LogEntry }> = ({ log }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const timestamp = new Date(log.timestamp * 1000);
    const timeStr = timestamp.toLocaleTimeString();

    return (
        <div className={`
            group relative bg-black border-2 rounded-lg
            transition-all duration-200 ease-out
            ${isExpanded
                ? 'border-gray-400 shadow-lg shadow-gray-400/20'
                : 'border-gray-600 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/10'
            }
        `}>
            {/* 🎯 RESPONSIVE Header */}
            <div className="p-2.5 sm:p-3 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />
                        <h3 className="font-semibold text-white font-mono text-xs sm:text-sm truncate">
                            {log.action}
                        </h3>
                    </div>
                    <span className="text-xs text-gray-500 font-mono flex-shrink-0 ml-1.5 sm:ml-2">
                        {timeStr}
                    </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                    <span>{formatDate(log.timestamp)}</span>
                </div>
            </div>

            {/* 🎯 RESPONSIVE Accordion Content */}
            {isExpanded && (
                <div className="border-t-2 border-gray-600 bg-gray-950">
                    <div className="p-3 sm:p-4">
                        <div className="space-y-3 sm:space-y-4">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <span className="text-xs sm:text-sm text-white font-mono font-bold uppercase tracking-wide">
                                    {log.action}
                                </span>
                                <div className="flex-1 h-px bg-gray-700"></div>
                                <span className="text-xs text-gray-500 font-mono">
                                    ID: {log.id}
                                </span>
                            </div>

                            <div className="bg-black/60 border-2 border-gray-700 rounded p-3 sm:p-4">
                                <div className="space-y-2 sm:space-y-3">
                                    <div>
                                        <h4 className="text-xs sm:text-sm font-bold text-white font-mono mb-1.5 sm:mb-2">Message:</h4>
                                        <p className="text-gray-300 font-mono text-xs sm:text-sm">
                                            {log.message}
                                        </p>
                                    </div>

                                    {log.content && (
                                        <div>
                                            <h4 className="text-xs sm:text-sm font-bold text-white font-mono mb-1.5 sm:mb-2">Details:</h4>
                                            <pre className="text-gray-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap max-h-48 sm:max-h-64 overflow-y-auto">
                                                {log.content}
                                            </pre>
                                        </div>
                                    )}

                                    <div className="pt-1.5 sm:pt-2 border-t border-gray-700 text-xs font-mono text-gray-500">
                                        <span>Timestamp: {timestamp.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const LogsScreen: React.FC<LogsScreenProps> = ({ onBack }) => {
    const [showClearModal, setShowClearModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const toast = useToastHelpers();
    const {
        filteredLogs,
        isLoading,
        error,
        loadAllLogs,
        exportLogs,
        clearAllLogs,
        setFilters,
        clearError
    } = useLogStore();

    // Keyboard shortcuts
    useKeyboardShortcuts({
        shortcuts: [
            {
                key: 'Escape',
                callback: onBack,
                description: 'Back to vault'
            }
        ],
        enabled: !showClearModal
    });

    // Load logs on mount
    useEffect(() => {
        loadAllLogs();
    }, [loadAllLogs]);

    // Handle search
    useEffect(() => {
        setFilters({ searchQuery: searchQuery.trim() || undefined });
    }, [searchQuery, setFilters]);

    const handleExportLogs = async () => {
        try {
            const exportData = await exportLogs();
            const timestamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-');
            const filename = `vault-logs--${timestamp}.json`;

            const blob = new Blob([exportData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            toast.success("Export complete!", `Logs exported as ${filename}`);
        } catch (error) {
            toast.error("Export failed", error instanceof Error ? error.message : "Failed to export logs");
        }
    };

    const handleClearLogs = async (password: string) => {
        try {
            const clearedCount = await clearAllLogs(password);
            setShowClearModal(false);
            toast.success("Logs cleared!", `${clearedCount} log entries removed`);
        } catch (error) {
            toast.error("Clear failed", error instanceof Error ? error.message : "Failed to clear logs");
            throw error;
        }
    };

    return (
        <>
            {/* 🎯 RESPONSIVE Container */}
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
                                    onClick={onBack}
                                    title="Back to Vault"
                                />
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-black" />
                                </div>
                                <div>
                                    <h1 className="text-sm sm:text-lg font-bold text-white font-mono">Activity Logs</h1>
                                    <p className="text-xs text-gray-400 font-mono">Security audit trail</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Download}
                                    onClick={handleExportLogs}
                                    disabled={isLoading || filteredLogs.length === 0}
                                    title="Export logs"
                                />

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    icon={Trash2}
                                    onClick={() => setShowClearModal(true)}
                                    disabled={isLoading || filteredLogs.length === 0}
                                    title="Clear all logs"
                                    className="text-red-400 hover:text-red-300"
                                />
                            </div>
                        </div>
                    </header>

                    {/* 🎯 RESPONSIVE Stats Bar */}
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-800 flex-shrink-0">
                        <div className="flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-lg sm:text-xl font-bold text-white font-mono">{filteredLogs.length}</div>
                                <div className="text-xs text-gray-400 font-mono">Total Logs</div>
                            </div>
                        </div>
                    </div>

                    {/* 🎯 RESPONSIVE Search Bar */}
                    <div className="px-3 py-4 sm:px-4 sm:py-6 border-b border-gray-800 flex-shrink-0">
                        <div className="relative">
                            <div className="relative bg-black border-2 border-gray-600 rounded-lg hover:border-gray-400 transition-all duration-200 focus-within:border-white focus-within:shadow-lg focus-within:shadow-gray-400/20">
                                <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search logs by action, message, or content..."
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
                                <div className="text-white font-mono text-sm sm:text-base">Loading logs...</div>
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Empty State */}
                        {!isLoading && filteredLogs.length === 0 && (
                            <div className="text-center py-12 sm:py-16">
                                <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                                <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 font-mono">No Logs</h3>
                                <p className="text-gray-400 font-mono text-sm sm:text-base">
                                    {searchQuery.trim()
                                        ? `No logs found for "${searchQuery}"`
                                        : "No activity logs to display"
                                    }
                                </p>
                            </div>
                        )}

                        {/* 🎯 RESPONSIVE Logs Grid */}
                        {!isLoading && filteredLogs.length > 0 && (
                            <div className="grid grid-cols-1 gap-3 sm:gap-4">
                                {filteredLogs.map(log => (
                                    <LogCard key={log.id} log={log} />
                                ))}
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
                                    onClick={clearError}
                                    className="text-red-400 hover:text-red-300"
                                >
                                    Dismiss
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Modal */}
            <PasswordModal
                isOpen={showClearModal}
                title="Clear All Logs"
                description="Enter your master password to permanently delete all log entries."
                onSubmit={handleClearLogs}
                onCancel={() => setShowClearModal(false)}
                isLoading={isLoading}
                destructive={true}
            />
        </>
    );
};