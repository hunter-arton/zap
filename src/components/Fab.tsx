// src/components/Fab.tsx - FULLY RESPONSIVE
import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "./Button";

interface FabProps {
    onCreateBox: () => void;
    className?: string;
}

interface TooltipProps {
    text: string;
    show: boolean;
}

const Tooltip: React.FC<TooltipProps> = ({ text, show }) => {
    if (!show) return null;

    return (
        <div className="absolute right-12 sm:right-16 top-1/2 -translate-y-1/2 z-60">
            <div className="bg-black border border-white rounded px-2 py-1.5 sm:px-3 sm:py-2 shadow-lg">
                <span className="text-white text-xs sm:text-sm font-mono whitespace-nowrap">
                    {text}
                </span>
            </div>
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-4 border-transparent border-l-black"></div>
        </div>
    );
};

export const Fab: React.FC<FabProps> = ({
    onCreateBox,
    className = ""
}) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 ${className}`}>
            <div className="relative">
                <Button
                    variant="primary"
                    size="lg"
                    icon={Plus}
                    onClick={onCreateBox}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-12 h-12 sm:w-14 sm:h-14 p-0"
                />
                <Tooltip text="Create Box" show={isHovered} />
            </div>
        </div>
    );
};