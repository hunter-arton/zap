// src/components/Button.tsx - YOUR ORIGINAL + RESPONSIVE SIZING
import React from "react";
import { LucideIcon } from "lucide-react";

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
    variant?: "primary" | "secondary" | "danger" | "ghost";
    size?: "xs" | "sm" | "md" | "lg";
    icon?: LucideIcon;
    children?: React.ReactNode;
    circular?: boolean;
    type?: "button" | "submit" | "reset";
}

export const Button: React.FC<ButtonProps> = ({
    variant = "primary",
    size = "md",
    icon: Icon,
    children,
    circular = false,
    className = "",
    disabled = false,
    type = "button",
    ...props
}) => {
    const isIconOnly = Icon && !children;

    // Base styles (your original)
    const baseStyles = `
        inline-flex items-center justify-center font-mono font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black
        disabled:opacity-60 disabled:cursor-not-allowed
        border select-none
        hover:scale-105 active:scale-95
        disabled:hover:scale-100 disabled:active:scale-100
    `;

    // Border radius (your original)
    const borderRadius = circular ? "rounded-full" : "rounded";

    // Variant styles (your original)
    const variantStyles = {
        primary: `
            bg-white text-black border-white
            hover:bg-gray-100 hover:shadow-md hover:shadow-white/20
            focus:ring-white
        `,
        secondary: `
            bg-black text-white border-gray-400
            hover:bg-gray-900 hover:border-white hover:shadow-md hover:shadow-gray-400/20
            focus:ring-gray-400
        `,
        danger: `
            bg-red-600 text-white border-red-500
            hover:bg-red-700 hover:border-red-400 hover:shadow-md hover:shadow-red-500/20
            focus:ring-red-500
        `,
        ghost: `
            bg-transparent text-gray-400 border-gray-600
            hover:bg-gray-900 hover:text-white hover:border-gray-400
            focus:ring-gray-500
        `,
    };

    // MODIFIED: Your original sizes + responsive adjustments for narrow windows
    const sizeStyles = {
        xs: isIconOnly
            ? "w-4 h-4 p-0 flex items-center justify-center sm:w-5 sm:h-5"
            : "px-1.5 py-0.5 text-xs h-5 sm:px-2 sm:py-1 sm:h-6",
        sm: isIconOnly
            ? "w-5 h-5 p-0 flex items-center justify-center sm:w-6 sm:h-6"
            : "px-2 py-1 text-xs h-6 sm:px-3 sm:py-1.5 sm:h-7",
        md: isIconOnly
            ? "w-6 h-6 p-0 flex items-center justify-center sm:w-8 sm:h-8"
            : "px-3 py-1.5 text-xs h-7 sm:px-4 sm:py-2 sm:text-sm sm:h-9",
        lg: isIconOnly
            ? "w-8 h-8 p-0 flex items-center justify-center sm:w-11 sm:h-11"
            : "px-4 py-2 text-sm h-9 sm:px-6 sm:py-3 sm:text-base sm:h-12",
    };

    // MODIFIED: Your original icon sizes + responsive adjustments  
    const iconSizes = {
        xs: "w-2.5 h-2.5 sm:w-3 sm:h-3",
        sm: "w-3 h-3 sm:w-3.5 sm:h-3.5",
        md: "w-3 h-3 sm:w-4 sm:h-4",
        lg: "w-4 h-4 sm:w-5 sm:h-5",
    };

    // Spacing (your original)
    const spacing = Icon && children ? "gap-1.5 sm:gap-2" : "";

    // Combine classes (your original approach)
    const buttonClasses = [
        baseStyles,
        borderRadius,
        variantStyles[variant],
        sizeStyles[size],
        spacing,
        className
    ].filter(Boolean).join(" ").replace(/\s+/g, ' ').trim();

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled}
            {...props}
        >
            {Icon && <Icon className={iconSizes[size]} />}
            {children}
        </button>
    );
};