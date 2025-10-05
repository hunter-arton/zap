// src/components/ActiveSessionModal.tsx - FULLY RESPONSIVE
import React, { useState, useEffect } from "react";
import { X, Code, Square, Search } from "lucide-react";
import { Button } from "./Button";
import { useDevStore } from "../stores";
import { truncateName } from "../utils";
import type { ActiveSessionInfo } from "../types";

interface ActiveSessionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSessionStopped?: () => void;
}

export const ActiveSessionModal: React.FC<ActiveSessionModalProps> = ({
    isOpen,
    onClose,
    onSessionStopped,
}) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [filteredSessions, setFilteredSessions] = useState<ActiveSessionInfo[]>([]);
    const [stoppingSessions, setStoppingSessions] = useState<Set<string>>(new Set());

    const {
        sessions,
        loadAllSessions,
        stopSession
    } = useDevStore();

    // Load sessions when modal opens
    useEffect(() => {
        if (isOpen) {
            loadAllSessions();
            setSearchQuery(""); // Clear search when opening
        }
    }, [isOpen, loadAllSessions]);

    // Filter sessions based on search query
    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredSessions(sessions);
        } else {
            const query = searchQuery.toLowerCase();
            const filtered = sessions.filter(session =>
                session.session_name.toLowerCase().includes(query) ||
                session.box_name.toLowerCase().includes(query)
            );
            setFilteredSessions(filtered);
        }
    }, [sessions, searchQuery]);

    if (!isOpen) return null;

    const handleStopSession = async (sessionName: string) => {
        // Prevent double-clicking
        if (stoppingSessions.has(sessionName)) return;

        setStoppingSessions(prev => new Set(prev).add(sessionName));

        try {
            await stopSession(sessionName);

            // Refresh sessions after stopping
            await loadAllSessions();

            if (onSessionStopped) {
                onSessionStopped();
            }
        } catch (error) {
            console.error("Failed to stop session:", error);
        } finally {
            setStoppingSessions(prev => {
                const newSet = new Set(prev);
                newSet.delete(sessionName);
                return newSet;
            });
        }
    };

    const isStoppingSession = (sessionName: string) => stoppingSessions.has(sessionName);

    // 🎯 RESPONSIVE Session card renderer - inspired by SelectionModal cards
    const renderSessionCard = (session: ActiveSessionInfo) => (
        <div
            key={session.session_name}
            className="bg-black border-2 border-gray-600 rounded-lg p-2.5 sm:p-3 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/10 transition-all duration-200"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                        <h4 className="text-white font-mono font-medium text-xs sm:text-sm truncate">
                            {truncateName(session.session_name, 20)}
                        </h4>
                        <p className="text-gray-400 text-xs font-mono truncate">
                            Box: {truncateName(session.box_name, 15)} • {session.secrets_count} secrets
                        </p>
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="sm"
                    icon={isStoppingSession(session.session_name) ? undefined : Square}
                    onClick={() => handleStopSession(session.session_name)}
                    disabled={isStoppingSession(session.session_name)}
                    title={`Stop ${session.session_name}`}
                    className="text-red-400 hover:text-red-300 flex-shrink-0"
                >
                    {isStoppingSession(session.session_name) && (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    )}
                </Button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="w-full max-w-lg h-[80vh] bg-black border-2 border-white rounded-lg flex flex-col">

                {/* 🎯 RESPONSIVE Header - SAME AS SELECTIONMODAL */}
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Code className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" />
                        <h1 className="text-sm sm:text-lg font-bold text-white font-mono">
                            Active Dev Sessions
                        </h1>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        icon={X}
                        onClick={onClose}
                    />
                </div>

                {/* 🎯 RESPONSIVE Search Bar - SAME AS SELECTIONMODAL */}
                <div className="p-4 sm:p-6 border-b border-gray-800 flex-shrink-0">
                    <div className="relative">
                        <div className="relative bg-black border-2 border-gray-600 rounded-lg hover:border-gray-400 transition-all duration-200 focus-within:border-white focus-within:shadow-lg focus-within:shadow-gray-400/20">
                            <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search sessions by name or box..."
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
                    {searchQuery && (
                        <p className="text-xs sm:text-sm text-gray-400 font-mono mt-2">
                            Found {filteredSessions.length} session{filteredSessions.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                {/* 🎯 RESPONSIVE Sessions List - SAME SCROLLABLE PATTERN */}
                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6">
                    {filteredSessions.length === 0 ? (
                        <div className="text-center py-12 sm:py-16">
                            <Code className="w-12 h-12 sm:w-16 sm:h-16 text-gray-600 mx-auto mb-3 sm:mb-4" />
                            <h3 className="text-base sm:text-lg font-bold text-white mb-1.5 sm:mb-2 font-mono">
                                {searchQuery ? "No Matching Sessions" : "No Active Sessions"}
                            </h3>
                            <p className="text-gray-400 font-mono text-sm sm:text-base">
                                {searchQuery
                                    ? `No sessions found for "${searchQuery}"`
                                    : "Start a dev session from any dev-enabled box"
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3 sm:gap-4">
                            {filteredSessions.map(renderSessionCard)}
                        </div>
                    )}
                </div>

                {/* 🎯 RESPONSIVE Footer Info - SAME AS SELECTIONMODAL */}
                {sessions.length > 0 && (
                    <div className="p-4 sm:p-6 border-t border-gray-800 flex-shrink-0">
                        <p className="text-center text-xs text-gray-500 font-mono">
                            {sessions.length} session{sessions.length !== 1 ? 's' : ''} running
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};