// src/components/ShortcutsTooltip.tsx - FULLY RESPONSIVE
import React, { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "./Button";

interface Shortcut {
    key: string;
    description: string;
}

interface ShortcutsTooltipProps {
    shortcuts: Shortcut[];
    title?: string;
}

export const ShortcutsTooltip: React.FC<ShortcutsTooltipProps> = ({
    shortcuts,
    title = "Keyboard Shortcuts"
}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="sm"
                icon={Info}
                onClick={() => setShowTooltip(!showTooltip)}
                title="View keyboard shortcuts"
            />
            {showTooltip && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowTooltip(false)}
                    />
                    <div className="absolute top-6 sm:top-8 right-0 bg-black border-2 border-white rounded p-2.5 sm:p-3 z-20 w-56 sm:w-64 text-xs font-mono">
                        <div className="text-white font-bold mb-1.5 sm:mb-2">{title}:</div>
                        <div className="text-gray-400 space-y-0.5 sm:space-y-1">
                            {shortcuts.map((shortcut, index) => (
                                <div key={index} className="flex justify-between items-center">
                                    <span className="text-xs">{shortcut.description}:</span>
                                    <span className="text-white text-xs font-medium">{shortcut.key}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};