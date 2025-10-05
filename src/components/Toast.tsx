// src/components/Toast.tsx - FULLY RESPONSIVE WITH APP UI

import React, { useState, createContext, useContext, useEffect } from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
}

interface ToastContextType {
    showToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};

const ToastItem: React.FC<{ toast: Toast; onClose: (id: string) => void }> = ({ toast, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const getIconColor = () => {
        switch (toast.type) {
            case "success": return "text-green-400";
            case "error": return "text-red-400";
            case "warning": return "text-yellow-400";
            case "info": return "text-blue-400";
        }
    };

    const getBorderColor = () => {
        switch (toast.type) {
            case "success": return "border-green-400";
            case "error": return "border-red-400";
            case "warning": return "border-yellow-400";
            case "info": return "border-blue-400";
        }
    };

    const getIcon = () => {
        const iconClass = `w-3.5 h-3.5 sm:w-4 sm:h-4 ${getIconColor()}`;
        switch (toast.type) {
            case "success": return <CheckCircle className={iconClass} />;
            case "error": return <XCircle className={iconClass} />;
            case "warning": return <AlertTriangle className={iconClass} />;
            case "info": return <Info className={iconClass} />;
        }
    };

    // Show animation on mount
    useEffect(() => {
        setTimeout(() => setIsVisible(true), 50);
    }, []);

    // Auto-close after 5 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        if (isClosing) return;

        setIsClosing(true);
        setIsVisible(false);

        // Wait for animation to complete before removing
        setTimeout(() => {
            onClose(toast.id);
        }, 300);
    };

    return (
        <div
            className={`
                bg-black border-2 ${getBorderColor()} rounded-lg shadow-lg font-mono
                transform transition-all duration-300 ease-out
                w-full max-w-sm sm:max-w-md
                ${isVisible && !isClosing
                    ? 'translate-x-0 opacity-100 scale-100'
                    : 'translate-x-full opacity-0 scale-95'
                }
            `}
        >
            <div className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                        {getIcon()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-white leading-tight">
                            {toast.title}
                        </h4>
                        {toast.message && (
                            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                {toast.message}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors rounded"
                        title="Close notification"
                    >
                        <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (toastData: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newToast: Toast = { id, ...toastData };

        console.log(`📢 Showing ${toastData.type} toast: ${toastData.title}`);

        setToasts(prev => {
            // Remove duplicates and keep max 4 toasts
            const filtered = prev.filter(t =>
                !(t.type === newToast.type && t.title === newToast.title)
            ).slice(0, 3);
            return [newToast, ...filtered];
        });
    };

    const hideToast = (id: string) => {
        console.log(`🗑️ Hiding toast: ${id}`);
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast Container - Responsive positioning */}
            {toasts.length > 0 && (
                <div className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] pointer-events-none">
                    <div className="space-y-2 sm:space-y-3 pointer-events-auto">
                        {toasts.map(toast => (
                            <ToastItem
                                key={toast.id}
                                toast={toast}
                                onClose={hideToast}
                            />
                        ))}
                    </div>
                </div>
            )}
        </ToastContext.Provider>
    );
};

export const useToastHelpers = () => {
    const { showToast } = useToast();
    return {
        success: (title: string, message?: string) => showToast({ type: "success", title, message }),
        error: (title: string, message?: string) => showToast({ type: "error", title, message }),
        warning: (title: string, message?: string) => showToast({ type: "warning", title, message }),
        info: (title: string, message?: string) => showToast({ type: "info", title, message }),
    };
};