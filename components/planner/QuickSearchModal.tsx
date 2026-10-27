'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Calendar, ArrowRight, Tag } from 'lucide-react';
import { PlannerItem } from './types';
import { FMT_STYLES, STATUS_BADGE_STYLES } from './constants';

interface QuickSearchModalProps {
    isOpen: boolean;
    onClose: () => void;
    items: PlannerItem[];
    onSelectItem: (item: PlannerItem) => void;
}

export function QuickSearchModal({ isOpen, onClose, items, onSelectItem }: QuickSearchModalProps) {
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setQuery('');
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const filtered = query.trim() === ''
        ? []
        : items.filter(it => {
            const q = query.toLowerCase();
            return (
                it.title?.toLowerCase().includes(q) ||
                it.fmt?.toLowerCase().includes(q) ||
                it.status?.toLowerCase().includes(q) ||
                it.date?.includes(q) ||
                it.note?.toLowerCase().includes(q) ||
                it.copy?.toLowerCase().includes(q) ||
                it.responsible?.toLowerCase().includes(q)
            );
        }).slice(0, 20);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/70 backdrop-blur-md" onClick={onClose}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.15 }}
                        className="bg-[#121212] border border-white/15 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Search input bar */}
                        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/10 bg-[#181818]">
                            <Search className="w-5 h-5 text-[#F7931E] shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder="Buscar contenido por título, formato, estado o fecha..."
                                className="flex-1 bg-transparent text-white text-sm outline-none placeholder-white/40"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery('')}
                                    className="text-white/40 hover:text-white p-1 rounded-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <kbd className="hidden md:inline-block px-2 py-0.5 rounded bg-white/10 text-[10px] text-white/50 font-mono">
                                ESC
                            </kbd>
                        </div>

                        {/* Search Results */}
                        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
                            {query.trim() === '' ? (
                                <div className="text-center py-10 text-white/30 text-xs">
                                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#F7931E]" />
                                    Escribe para buscar entre todo el contenido planificado...
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center py-10 text-white/40 text-sm">
                                    No se encontraron contenidos con &ldquo;<span className="text-white">{query}</span>&rdquo;
                                </div>
                            ) : (
                                filtered.map(item => {
                                    const fmtStyle = FMT_STYLES[item.fmt] || { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', dot: '#FFFFFF' };
                                    const statusStyle = STATUS_BADGE_STYLES[item.status] || { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };

                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                onSelectItem(item);
                                                onClose();
                                            }}
                                            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-[#181818] hover:bg-[#222222] border border-white/5 hover:border-white/20 transition-all text-left group"
                                        >
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 shrink-0 ${fmtStyle.bg} ${fmtStyle.border} ${fmtStyle.text}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fmtStyle.dot }} />
                                                    {item.fmt}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-white font-semibold text-sm truncate group-hover:text-[#F7931E] transition-colors">
                                                        {item.title || 'Sin título'}
                                                    </p>
                                                    <p className="text-white/40 text-xs flex items-center gap-2 mt-0.5">
                                                        <Calendar className="w-3 h-3 text-[#F7931E]" /> {item.date}
                                                        {item.responsible && <span>· {item.responsible}</span>}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}>
                                                    {item.status}
                                                </span>
                                                <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/80 group-hover:translate-x-0.5 transition-all" />
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>

                        {filtered.length > 0 && (
                            <div className="px-4 py-2 bg-[#161616] border-t border-white/5 text-[11px] text-white/40 flex justify-between">
                                <span>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
                                <span>Enter o clic para abrir en el calendario</span>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
