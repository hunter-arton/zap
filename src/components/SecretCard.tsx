// src/components/SecretCard.tsx - FULLY RESPONSIVE
import React, { useState } from "react";
import { Key, Eye, EyeOff, Copy, Edit, Trash2, MoreVertical } from "lucide-react";
import { Button } from "./Button";
import { formatDate, truncateName } from "../utils";
import type { Secret } from "../types";

interface SecretCardProps {
    secret: Secret;
    isRevealed: boolean;
    onReveal: () => void;
    onCopy: () => void;
    onEdit: () => void;
    onDelete: () => void;
    decryptedValue?: string;
    canModify?: boolean;
    isLoading?: boolean;
}

export const SecretCard: React.FC<SecretCardProps> = ({
    secret,
    isRevealed,
    onReveal,
    onCopy,
    onEdit,
    onDelete,
    decryptedValue,
    canModify = true,
    isLoading = false,
}) => {
    const [showMenu, setShowMenu] = useState(false);

    const getDisplayValue = () => {
        if (!isRevealed) return "";
        if (decryptedValue !== undefined) return decryptedValue;
        return "Loading...";
    };

    const handleMenuAction = (action: () => void) => {
        setShowMenu(false);
        if (canModify && !isLoading) {
            action();
        }
    };

    const isMultilineContent = decryptedValue && (
        decryptedValue.includes('\n') ||
        decryptedValue.includes('-----BEGIN') ||
        decryptedValue.length > 60
    );

    return (
        <div className={`
            group relative bg-black border-2 rounded-lg
            transition-all duration-200 ease-out
            ${isRevealed
                ? 'border-gray-400 shadow-lg shadow-gray-400/20'
                : 'border-gray-600 hover:border-gray-400 hover:shadow-lg hover:shadow-gray-400/10'
            }
            ${isLoading ? 'opacity-75' : ''}
        `}>
            {/* 🎯 RESPONSIVE Header */}
            <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
                        <Key className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 text-gray-400" />
                        <h3 className="font-semibold text-white font-mono text-xs sm:text-sm truncate" title={secret.name}>
                            {truncateName(secret.name, 20)}
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-1 sm:ml-2 relative z-10">
                        <Button
                            variant="ghost"
                            size="xs"
                            icon={isRevealed ? EyeOff : Eye}
                            onClick={onReveal}
                            disabled={isLoading}
                            title={isRevealed ? "Hide value" : "Reveal value"}
                        />

                        <Button
                            variant="ghost"
                            size="xs"
                            icon={Copy}
                            onClick={onCopy}
                            disabled={isLoading}
                            title="Copy to clipboard"
                        />

                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="xs"
                                icon={MoreVertical}
                                onClick={() => setShowMenu(!showMenu)}
                                disabled={isLoading}
                                title="More actions"
                            />

                            {showMenu && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                                    <div className="absolute top-6 right-0 bg-black border border-white rounded shadow-lg p-1 z-20 min-w-24 sm:min-w-28">
                                        <button
                                            onClick={() => handleMenuAction(onEdit)}
                                            disabled={!canModify || isLoading}
                                            className={`w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono ${!canModify || isLoading ? 'text-gray-500' : 'text-white hover:bg-gray-800'
                                                }`}
                                        >
                                            <Edit className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                            Edit
                                        </button>

                                        <button
                                            onClick={() => handleMenuAction(onDelete)}
                                            disabled={!canModify || isLoading}
                                            className={`w-full flex items-center gap-2 sm:gap-2.5 px-1.5 py-1 sm:px-2 sm:py-1 rounded transition-colors text-left text-xs sm:text-sm font-mono ${!canModify || isLoading ? 'text-gray-500' : 'text-red-400 hover:bg-red-900/20'
                                                }`}
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

                {/* 🎯 RESPONSIVE Footer */}
                <div className="flex items-center justify-between text-xs text-gray-500 font-mono">
                    <div></div>
                    <span className="text-xs">{formatDate(secret.created_at)}</span>
                </div>
            </div>

            {/* 🎯 RESPONSIVE Accordion Content */}
            {isRevealed && (
                <div className="border-t-2 border-gray-600 bg-gray-950">
                    <div className="p-2 sm:p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-4 sm:py-6">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-white font-mono text-xs sm:text-sm">Decrypting...</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 sm:space-y-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <span className="text-xs sm:text-sm text-white font-mono font-bold uppercase tracking-wide">
                                        {secret.name}
                                    </span>
                                    <div className="flex-1 h-px bg-gray-700"></div>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {decryptedValue ? `${decryptedValue.length} chars` : ''}
                                    </span>
                                </div>

                                <div className="bg-black/60 border-2 border-gray-700 rounded p-2 sm:p-4 font-mono text-xs sm:text-sm">
                                    {isMultilineContent ? (
                                        <pre className="text-white whitespace-pre-wrap break-words select-all max-h-48 sm:max-h-64 overflow-y-auto">
                                            {getDisplayValue()}
                                        </pre>
                                    ) : (
                                        <span className="text-white break-all select-all leading-relaxed">
                                            {getDisplayValue()}
                                        </span>
                                    )}
                                </div>

                                <div className="text-center text-xs text-gray-500 font-mono pt-1 sm:pt-2 border-t border-gray-700">
                                    <span>Click text to select all</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};