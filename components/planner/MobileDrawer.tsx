'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Calendar, Plus, Upload, Download, Check, Users,
    ListOrdered, BarChart3, Mail, Sparkles, Search, ChevronRight
} from 'lucide-react';
import { PlannerClient } from './types';

interface MobileDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    clients: PlannerClient[];
    curClient: string | null;
    screen: 'home' | 'calendar' | 'queue';
    suiteModule: 'content' | 'crm' | 'metrics' | 'email';
    onSelectModule: (mod: 'content' | 'crm' | 'metrics' | 'email') => void;
    onGoHome: () => void;
    onGoQueue: () => void;
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
    suiteModule,
    onSelectModule,
    onGoHome,
    onGoQueue,
    onSelectClient,
    onAddClient,
    onExportAll,
    onTriggerImport
}: MobileDrawerProps) {
    const [newName, setNewName] = useState('');
    const [clientQuery, setClientQuery] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;
        onAddClient(newName.trim());
        setNewName('');
        onClose();
    };

    const filteredClients = useMemo(() => {
        if (!clientQuery.trim()) return clients;
        const q = clientQuery.toLowerCase();
        return clients.filter(c => c.name.toLowerCase().includes(q));
    }, [clients, clientQuery]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm" onClick={onClose}>
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                        className="w-[85%] max-w-xs h-full bg-[#121212] border-r border-white/10 p-5 flex flex-col shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F7931E] to-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#F7931E]/20">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <span className="font-black text-white text-sm tracking-tight">
                                    LUMEN <span className="text-[#F7931E]">SUITE</span>
                                </span>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Body */}
                        <div className="flex-1 overflow-y-auto space-y-5 py-4 pr-1 scrollbar-hide">
                            {/* Section 1: Módulos Suite */}
                            <div className="space-y-1.5">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-white/30 px-2 pb-1">
                                    Módulos
                                </p>

                                <button
                                    onClick={() => {
                                        onSelectModule('content');
                                        onGoHome();
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                        suiteModule === 'content' && screen === 'home'
                                            ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                            : 'text-white/70 hover:bg-white/5'
                                    }`}
                                >
                                    <span className="text-sm">⌂</span>
                                    <span className="flex-1 text-left">Inicio / Tablero</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onSelectModule('content');
                                        onGoQueue();
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                        suiteModule === 'content' && screen === 'queue'
                                            ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                            : 'text-white/70 hover:bg-white/5'
                                    }`}
                                >
                                    <ListOrdered className="w-4 h-4" />
                                    <span className="flex-1 text-left">Cola de Producción</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onSelectModule('crm');
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                        suiteModule === 'crm'
                                            ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                            : 'text-white/70 hover:bg-white/5'
                                    }`}
                                >
                                    <Users className="w-4 h-4" />
                                    <span className="flex-1 text-left">CRM Leads</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onSelectModule('metrics');
                                        onClose();
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                        suiteModule === 'metrics'
                                            ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                            : 'text-white/70 hover:bg-white/5'
                                    }`}
                                >
                                    <BarChart3 className="w-4 h-4" />
                                    <span className="flex-1 text-left">Métricas</span>
                                </button>

                                <button
                                    onClick={() => {
                                        onSelectModule('email');
                                        onClose();
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                                        suiteModule === 'email'
                                            ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                            : 'text-white/40 hover:bg-white/5'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Mail className="w-4 h-4" />
                                        <span>Correo</span>
                                    </div>
                                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-white/50">Próx</span>
                                </button>
                            </div>

                            {/* Section 2: Clientes */}
                            <div className="space-y-2 pt-2 border-t border-white/5">
                                <div className="flex items-center justify-between px-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/30">
                                        Clientes ({clients.length})
                                    </span>
                                </div>

                                {/* Quick filter input */}
                                {clients.length > 3 && (
                                    <div className="relative px-1">
                                        <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <input
                                            value={clientQuery}
                                            onChange={e => setClientQuery(e.target.value)}
                                            placeholder="Buscar cliente..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]"
                                        />
                                    </div>
                                )}

                                <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    {filteredClients.map(c => {
                                        const isActive = screen === 'calendar' && curClient === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => {
                                                    onSelectClient(c.id);
                                                    onClose();
                                                }}
                                                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                    isActive
                                                        ? 'bg-white/15 text-white border border-white/20'
                                                        : 'text-white/70 hover:bg-white/5'
                                                }`}
                                            >
                                                <div
                                                    className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden"
                                                    style={{ backgroundColor: c.color }}
                                                >
                                                    {c.avatar ? (
                                                        <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        c.name.trim()[0]?.toUpperCase() ?? '?'
                                                    )}
                                                </div>
                                                <span className="truncate flex-1 text-left">{c.name}</span>
                                                {isActive ? (
                                                    <Check className="w-3.5 h-3.5 text-[#F7931E] shrink-0" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer: Add client & Backup tools */}
                        <div className="pt-3 border-t border-white/10 space-y-2.5 shrink-0">
                            <form onSubmit={handleAdd} className="flex gap-2">
                                <input
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    placeholder="Nuevo cliente..."
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]"
                                />
                                <button
                                    type="submit"
                                    className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-3 py-2 text-xs font-bold shrink-0 flex items-center gap-1 shadow-md shadow-[#F7931E]/20"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Añadir
                                </button>
                            </form>

                            <div className="flex gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        onTriggerImport();
                                        onClose();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium"
                                >
                                    <Upload className="w-3 h-3" /> Importar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onExportAll();
                                        onClose();
                                    }}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/60 hover:text-white text-xs font-medium"
                                >
                                    <Download className="w-3 h-3" /> Respaldo
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
