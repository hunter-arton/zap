// src/components/ActiveSessionsBanner.tsx - FULLY RESPONSIVE
import React from "react";
import { Code, ChevronRight } from "lucide-react";

interface ActiveSessionsBannerProps {
    sessionCount: number;
    onClick: () => void;
}

export const ActiveSessionsBanner: React.FC<ActiveSessionsBannerProps> = ({
    sessionCount,
    onClick,
}) => {
    if (sessionCount === 0) return null;

    return (
        <div className="px-3 py-2.5 sm:px-4 sm:py-3 border-b border-gray-800 flex-shrink-0">
            <div
                onClick={onClick}
                className="bg-black border-2 border-green-400 rounded-lg p-3 sm:p-4 cursor-pointer hover:border-green-300 transition-all duration-200 hover:shadow-lg hover:shadow-green-400/10"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <Code className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                        <div>
                            <h4 className="text-green-400 font-mono font-bold text-xs sm:text-sm">
                                Active Dev Sessions
                            </h4>
                            <p className="text-green-300 text-xs font-mono">
                                {sessionCount} session{sessionCount !== 1 ? 's' : ''} running
                            </p>
                        </div>
                    </div>

                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                </div>
            </div>
        </div>
    );
};