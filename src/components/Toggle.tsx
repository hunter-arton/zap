// src/components/ui/Toggle.tsx
import React from "react";

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    size?: "sm" | "md" | "lg";
    label?: string;
    disabled?: boolean;
    className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
    checked,
    onChange,
    size = "md",
    label,
    disabled = false,
    className = "",
}) => {
    const sizes = {
        sm: {
            track: "w-10 h-5",
            thumb: "w-4 h-4",
            translate: checked ? "translate-x-5" : "translate-x-0.5",
            text: "text-sm",
        },
        md: {
            track: "w-12 h-6",
            thumb: "w-5 h-5",
            translate: checked ? "translate-x-6" : "translate-x-0.5",
            text: "text-base",
        },
        lg: {
            track: "w-14 h-7",
            thumb: "w-6 h-6",
            translate: checked ? "translate-x-7" : "translate-x-0.5",
            text: "text-lg",
        },
    };

    const sizeConfig = sizes[size];

    const getTrackColor = () => {
        if (disabled) return "bg-gray-700";
        return checked ? "bg-white" : "bg-gray-600";
    };

    const getThumbColor = () => {
        if (disabled) return "bg-gray-500";
        return "bg-black";
    };

    const handleToggle = () => {
        if (!disabled) {
            onChange(!checked);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleToggle();
        }
    };

    return (
        <div className={`flex items-center gap-3 ${className}`}>

            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={label || "Toggle"}
                onClick={handleToggle}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className={`
                    relative inline-flex items-center rounded-full border  transition-all duration-200 ease-in-out
                    ${sizeConfig.track}
                    ${getTrackColor()}
                    ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
                `}
            >
                <span
                    className={`
                        inline-block rounded-full transition-transform duration-200 ease-in-out
                        ${sizeConfig.thumb}
                        ${getThumbColor()}
                        ${sizeConfig.translate}
                    `}
                />
            </button>
            {label && (
                <label
                    className={`
                        font-mono text-white select-none 
                        ${sizeConfig.text}
                        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `}
                    onClick={handleToggle}
                >
                    {label}
                </label>
            )}


        </div>
    );
};