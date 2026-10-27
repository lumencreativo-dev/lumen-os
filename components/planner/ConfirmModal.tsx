'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Eliminar',
    cancelLabel = 'Cancelar',
    isDestructive = true,
    onConfirm,
    onCancel
}: ConfirmModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.15 }}
                        className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl relative"
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={onCancel}
                            className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                                isDestructive ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#F7931E]/10 text-[#F7931E] border border-[#F7931E]/20'
                            }`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-white text-lg leading-snug">{title}</h3>
                                <p className="text-white/60 text-sm mt-1.5 leading-relaxed">{message}</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-white/5">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="px-4 py-2 rounded-xl text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-all"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={onConfirm}
                                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                                    isDestructive
                                        ? 'bg-red-600 hover:bg-red-500 shadow-red-900/30'
                                        : 'bg-[#F7931E] hover:bg-[#F7931E]/90 shadow-[#F7931E]/20'
                                }`}
                            >
                                {confirmLabel}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
