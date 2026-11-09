"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X, AlertTriangle } from "lucide-react";

// Toast Types
type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
    dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
    warning: AlertTriangle,
};

const TOAST_STYLES = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const TOAST_ICON_STYLES = {
    success: "text-green-500",
    error: "text-red-500",
    info: "text-blue-500",
    warning: "text-amber-500",
};

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, title: string, message?: string, duration = 4000) => {
        const id = Date.now().toString() + Math.random().toString(36).slice(2);
        const newToast: Toast = { id, type, title, message, duration };

        setToasts(prev => [...prev, newToast]);

        // Auto dismiss
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        }
    }, []);

    const dismiss = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const success = useCallback((title: string, message?: string) => {
        addToast("success", title, message);
    }, [addToast]);

    const error = useCallback((title: string, message?: string) => {
        addToast("error", title, message, 6000);
    }, [addToast]);

    const info = useCallback((title: string, message?: string) => {
        addToast("info", title, message);
    }, [addToast]);

    const warning = useCallback((title: string, message?: string) => {
        addToast("warning", title, message, 5000);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ toasts, success, error, info, warning, dismiss }}>
            {children}

            {/* Toast Container */}
            <div suppressHydrationWarning className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
                <AnimatePresence mode="popLayout">
                    {toasts.map(toast => {
                        const Icon = TOAST_ICONS[toast.type];
                        return (
                            <motion.div
                                key={toast.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-sm ${TOAST_STYLES[toast.type]}`}
                            >
                                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${TOAST_ICON_STYLES[toast.type]}`} />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm">{toast.title}</p>
                                    {toast.message && (
                                        <p className="text-sm opacity-80 mt-0.5">{toast.message}</p>
                                    )}
                                </div>
                                <button
                                    onClick={() => dismiss(toast.id)}
                                    className="p-1 hover:bg-black/5 rounded transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
}

