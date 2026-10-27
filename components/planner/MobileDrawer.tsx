'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Plus, Upload, Download, Check, Users } from 'lucide-react';
import { PlannerClient } from './types';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    clients: PlannerClient[];
    curClient: string | null;
    screen: 'home' | 'calendar';
    onGoHome: () => void;
    onSelectClient: (clientId: string) => void;
    onAddClient: (name: string) => void;
    onExportAll: () => void;
    onTriggerImport: () => void;
}

export function MobileDrawer({
    isOpen,
    onClose,
    clients,
    curClient,
    screen,
    onGoHome,
    onSelectClient,
    onAddClient,
    onExportAll,
    onTriggerImport
}: MobileDrawerProps) {
    const [newName, setNewName] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        onAddClient(newName.trim());
        setNewName('');
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                        className="w-[85%] max-w-sm h-full bg-[#111111] border-r border-white/10 p-5 flex flex-col shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-[#F7931E] flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-black text-white text-sm tracking-tight">
                                    LUMEN <span className="text-[#F7931E]">PLANNER</span>
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Navigation Actions */}
                        <div className="py-4 space-y-1.5">
                            <button
                                onClick={() => {
                                    onGoHome();
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                                    screen === 'home'
                                        ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                        : 'text-white/70 hover:bg-white/5'
                                }`}
                            >
                                <span className="text-base">⌂</span>
                                <span>Inicio (Todos los clientes)</span>
                            </button>
                        </div>

                        {/* Clients Section */}
                        <div className="flex items-center justify-between text-xs font-bold text-white/40 uppercase tracking-wider px-1 pt-2 pb-1">
                            <span>Clientes ({clients.length})</span>
                            <Users className="w-3.5 h-3.5" />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-1 py-1 pr-1">
                            {clients.map(c => {
                                const isActive = screen === 'calendar' && curClient === c.id;
                                return (
                                    <button
                                        key={c.id}
                                        onClick={() => {
                                            onSelectClient(c.id);
                                            onClose();
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                            isActive
                                                ? 'bg-white/15 text-white border border-white/20'
                                                : 'text-white/70 hover:bg-white/5'
                                        }`}
                                    >
                                        <div
                                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden"
                                            style={{ backgroundColor: c.color }}
                                        >
                                            {c.avatar ? (
                                                <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                                            ) : (
                                                c.name.trim()[0]?.toUpperCase() ?? '?'
                                            )}
                                        </div>
                                        <span className="truncate flex-1 text-left">{c.name}</span>
                                        {isActive && <Check className="w-4 h-4 text-[#F7931E] shrink-0" />}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Add Client Form */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <form onSubmit={handleAdd} className="flex gap-2">
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Nombre del cliente..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/50"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-3 py-2 text-xs font-bold shrink-0 flex items-center gap-1 shadow-md shadow-[#F7931E]/20"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir
                                </button>
                            </form>

                            {/* Backups */}
                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onTriggerImport();
                                        onClose();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-medium"
                                >
                                    <Upload className="w-3.5 h-3.5" /> Importar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onExportAll();
                                        onClose();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-medium"
                                >
                                    <Download className="w-3.5 h-3.5" /> Respaldo
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
