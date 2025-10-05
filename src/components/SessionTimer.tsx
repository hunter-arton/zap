// src/components/SessionTimer.tsx - FULLY RESPONSIVE
import React from "react";
import { Clock } from "lucide-react";
import { formatTime } from "../utils";
import { useAuthStore } from "../stores";

interface SessionTimerProps {
    className?: string;
}

export const SessionTimer: React.FC<SessionTimerProps> = ({ className = "" }) => {
    const isUnlocked = useAuthStore(state => state.isUnlocked);
    const frontendTimeLeft = useAuthStore(state => state.frontendTimeLeft);

    if (!isUnlocked) return null;

    const isWarning = frontendTimeLeft <= 30;
    const isExpired = frontendTimeLeft <= 0;

    const getTextColor = () => {
        if (isExpired) return "text-red-400";
        if (isWarning) return "text-yellow-400";
        return "text-white";
    };

    return (
        <div className={`flex items-center gap-1.5 sm:gap-2 font-mono ${getTextColor()} ${className}`}>
            <Clock className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isWarning ? "animate-pulse" : ""}`} />
            <span className="text-xs sm:text-sm" title={`${frontendTimeLeft} seconds remaining`}>
                {formatTime(frontendTimeLeft)}
            </span>
        </div>
    );
};