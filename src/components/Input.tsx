// src/components/Input.tsx - YOUR ORIGINAL + RESPONSIVE SIZING
import React, { useState } from "react";
import { Eye, EyeOff, Search, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
    variant?: "default" | "password" | "search";
    label?: string;
    error?: string;
    isValid?: boolean;
    isChecking?: boolean;
}

export const Input: React.FC<InputProps> = ({
    variant = "default",
    label,
    error,
    isValid,
    isChecking,
    className = "",
    ...props
}) => {
    const [showPassword, setShowPassword] = useState(false);

    // MODIFIED: Your original base styles + responsive padding and text
    const baseStyles = "w-full bg-black text-white border rounded outline-none font-mono transition-colors px-2.5 py-2 text-xs sm:px-4 sm:py-3 sm:text-sm";

    // Border color logic (your original)
    const getBorderColor = () => {
        if (error) return "border-red-500 focus:border-red-400";
        if (isValid === false) return "border-red-500 focus:border-red-400";
        if (isValid === true) return "border-green-500 focus:border-green-400";
        return "border-gray-600 focus:border-white hover:border-gray-500";
    };

    // Auto complete props (your original)
    const getAutoCompleteProps = () => ({
        autoComplete: "off",
        autoCorrect: "off",
        autoCapitalize: "off",
        spellCheck: false,
    });

    // Validation icon (enhanced from your original)
    const getValidationIcon = () => {
        if (isChecking) return <Loader2 className="w-3 h-3 animate-spin text-blue-400 sm:w-4 sm:h-4" />;
        if (isValid === true) return <CheckCircle className="w-3 h-3 text-green-400 sm:w-4 sm:h-4" />;
        if (isValid === false) return <XCircle className="w-3 h-3 text-red-400 sm:w-4 sm:h-4" />;
        return null;
    };

    // MODIFIED: Your original render logic + responsive icon sizes
    const renderInput = () => {
        switch (variant) {
            case "password":
                return (
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            className={`${baseStyles} ${getBorderColor()} pr-8 sm:pr-12 ${className}`}
                            {...getAutoCompleteProps()}
                            {...props}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors sm:right-3"
                            tabIndex={-1}
                        >
                            {showPassword ?
                                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" /> :
                                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                            }
                        </button>
                        {getValidationIcon() && (
                            <div className="absolute right-6 top-1/2 -translate-y-1/2 sm:right-9">
                                {getValidationIcon()}
                            </div>
                        )}
                    </div>
                );

            case "search":
                return (
                    <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 sm:left-3 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            className={`${baseStyles} ${getBorderColor()} pl-7 sm:pl-12 ${className}`}
                            {...getAutoCompleteProps()}
                            {...props}
                        />
                        {getValidationIcon() && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-3">
                                {getValidationIcon()}
                            </div>
                        )}
                    </div>
                );

            default:
                return (
                    <div className="relative">
                        <input
                            className={`${baseStyles} ${getBorderColor()} ${getValidationIcon() ? 'pr-7 sm:pr-10' : ''} ${className}`}
                            {...getAutoCompleteProps()}
                            {...props}
                        />
                        {getValidationIcon() && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-3">
                                {getValidationIcon()}
                            </div>
                        )}
                    </div>
                );
        }
    };

    return (
        <div className="space-y-1 sm:space-y-2">
            {label && (
                <label className="block text-xs font-medium text-white font-mono sm:text-sm">
                    {label}
                </label>
            )}

            <div className="relative">
                {renderInput()}
                {/* Your original isChecking logic maintained for backward compatibility */}
                {isChecking && !getValidationIcon() && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 sm:right-3">
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin sm:w-4 sm:h-4" />
                    </div>
                )}
            </div>

            {error && <p className="text-red-400 text-xs font-mono sm:text-sm">{error}</p>}
        </div>
    );
};