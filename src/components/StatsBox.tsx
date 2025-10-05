// src/components/StatsBox.tsx
import React from "react";

interface StatsBoxProps {
    title: string;
    count: number;
    className?: string;
    countColor?: string;
}

export const StatsBox: React.FC<StatsBoxProps> = ({
    title,
    count,
    className = "",
    countColor = "text-white",
}) => {
    ;

    return (
        <div className={`text-center ${className}`}>
            <div className={`text-2xl font-bold font-mono ${countColor}`}>{count}</div>
            <div className="text-xs text-gray-400 font-mono">{title}</div>
        </div>
    );
};