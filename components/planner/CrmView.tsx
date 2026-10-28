'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Plus, MessageCircle, ArrowRight, UserCheck,
    Search, Filter, Calendar, Phone, Mail, DollarSign,
    Sparkles, AlertCircle, ChevronDown, Check, Trash2, X
} from 'lucide-react';
import { SuiteLead, LeadStage } from './types';
import { LEAD_STAGES, LEAD_SOURCES, uid, todayStr } from './constants';

interface CrmViewProps {
    leads: SuiteLead[];
    onAddLead: (lead: Omit<SuiteLead, 'id' | 'created_at'>) => void;
    onUpdateLead: (id: string, patch: Partial<SuiteLead>) => void;
    onDeleteLead: (id: string) => void;
    onConvertToClient: (lead: SuiteLead) => void;
}

export function CrmView({
    leads,
    onAddLead,
    onUpdateLead,
    onDeleteLead,
    onConvertToClient
}: CrmViewProps) {
    const today = todayStr();
    const [search, setSearch] = useState('');
    const [filterSource, setFilterSource] = useState<string>('');
    const [modalOpen, setModalOpen] = useState(false);
    const [activeLead, setActiveLead] = useState<SuiteLead | null>(null);

    // Form state for new lead
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newSource, setNewSource] = useState<SuiteLead['source']>('Instagram');
    const [newInterest, setNewInterest] = useState('');
    const [newBudget, setNewBudget] = useState('');
    const [newVal, setNewVal] = useState('');
    const [newNextAction, setNewNextAction] = useState('');
    const [newFollowup, setNewFollowup] = useState(today);
    const [newNotes, setNewNotes] = useState('');

    // Metrics calculations
    const totalLeads = leads.length;
    const wonLeads = leads.filter(l => l.stage === 'ganado').length;
    const closeRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0;
    const todayFollowups = leads.filter(l => l.followup_date === today && l.stage !== 'ganado' && l.stage !== 'perdido');

    // Filtering
    const filteredLeads = useMemo(() => {
        return leads.filter(l => {
            const matchesSearch = search === '' ||
                l.name.toLowerCase().includes(search.toLowerCase()) ||
                (l.email && l.email.toLowerCase().includes(search.toLowerCase())) ||
                (l.interest && l.interest.toLowerCase().includes(search.toLowerCase()));
            const matchesSource = filterSource === '' || l.source === filterSource;
            return matchesSearch && matchesSource;
        });
    }, [leads, search, filterSource]);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim()) return;

        onAddLead({
            name: newName.trim(),
            email: newEmail.trim() || undefined,
            whatsapp: newPhone.trim() || undefined,
            source: newSource,
            interest: newInterest.trim() || undefined,
            budget: newBudget.trim() || undefined,
            stage: 'nuevo',
            estimated_value: newVal ? Number(newVal) : undefined,
            next_action: newNextAction.trim() || undefined,
            followup_date: newFollowup || undefined,
            notes: newNotes.trim() || undefined
        });

        // Reset
        setNewName('');
        setNewEmail('');
        setNewPhone('');
        setNewSource('Instagram');
        setNewInterest('');
        setNewBudget('');
        setNewVal('');
        setNewNextAction('');
        setNewFollowup(today);
        setNewNotes('');
        setModalOpen(false);
    };

    const getWhatsAppUrl = (lead: SuiteLead) => {
        if (!lead.whatsapp) return null;
        const cleanPhone = lead.whatsapp.replace(/[^0-9]/g, '');
        const text = encodeURIComponent(`Hola ${lead.name}, te escribe el equipo de Lumen Creativo. ¿Cómo estás?`);
        return `https://wa.me/${cleanPhone}?text=${text}`;
    };

    return (
        <div className="space-y-6">
            {/* Top KPI Cards (Como en la guía: Leads, Ganados, Tasa de Cierre, Seguimientos) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <span className="text-white/40 text-xs font-medium">Total Prospectos</span>
                    <div className="text-2xl font-black text-white mt-1">{totalLeads}</div>
                    <span className="text-[10px] text-white/30">En tu embudo de ventas</span>
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <span className="text-white/40 text-xs font-medium">Clientes Ganados</span>
                    <div className="text-2xl font-black text-emerald-400 mt-1">{wonLeads}</div>
                    <span className="text-[10px] text-emerald-500/70">Convertidos a clientes</span>
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <span className="text-white/40 text-xs font-medium">Tasa de Cierre</span>
                    <div className="text-2xl font-black text-[#F7931E] mt-1">{closeRate}%</div>
                    <span className="text-[10px] text-[#F7931E]/70">Efectividad comercial</span>
                </div>
                <div className={`border rounded-2xl p-4 transition-all ${
                    todayFollowups.length > 0
                        ? 'bg-orange-950/20 border-[#F7931E]/40 shadow-lg shadow-[#F7931E]/5'
                        : 'bg-[#141414] border-white/5'
                }`}>
                    <div className="flex items-center justify-between">
                        <span className="text-white/40 text-xs font-medium">Seguimientos Hoy</span>
                        {todayFollowups.length > 0 && (
                            <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-ping" />
                        )}
                    </div>
                    <div className={`text-2xl font-black mt-1 ${todayFollowups.length > 0 ? 'text-[#F7931E]' : 'text-white/40'}`}>
                        {todayFollowups.length}
                    </div>
                    <span className="text-[10px] text-white/30">Por atender hoy</span>
                </div>
            </div>

            {/* Filter & Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                    <div className="relative flex-1">
                        <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Buscar prospecto por nombre, email o interés..."
                            className="w-full bg-[#1A1A1A] border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/50"
                        />
                    </div>
                    <div className="relative shrink-0">
                        <select
                            value={filterSource}
                            onChange={e => setFilterSource(e.target.value)}
                            className="appearance-none bg-[#1A1A1A] border border-white/10 rounded-xl text-xs text-white/80 pl-3 pr-8 py-1.5 outline-none focus:border-[#F7931E]/50 cursor-pointer"
                        >
                            <option value="">Todos los canales</option>
                            {LEAD_SOURCES.map(src => (
                                <option key={src} value={src}>{src}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                    </div>
                </div>

                <button
                    onClick={() => setModalOpen(true)}
                    className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F7931E]/20 transition-all shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" /> Nuevo Prospecto
                </button>
            </div>

            {/* Kanban Board Columns (Nuevo, Contactado, Calificado, Propuesta, Ganado, Perdido) */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 min-h-[500px]">
                {LEAD_STAGES.map(stage => {
                    const stageLeads = filteredLeads.filter(l => l.stage === stage.key);
                    return (
                        <div
                            key={stage.key}
                            className="bg-[#111111] border border-white/5 rounded-2xl p-3 flex flex-col"
                        >
                            {/* Column Header */}
                            <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full"
                                        style={{ backgroundColor: stage.color }}
                                    />
                                    <span className="text-xs font-bold text-white tracking-wide">
                                        {stage.label}
                                    </span>
                                </div>
                                <span className="text-[10px] font-bold text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                                    {stageLeads.length}
                                </span>
                            </div>

                            {/* Column Cards */}
                            <div className="space-y-2.5 flex-1 overflow-y-auto">
                                <AnimatePresence>
                                    {stageLeads.map(lead => {
                                        const waUrl = getWhatsAppUrl(lead);
                                        const isDueToday = lead.followup_date === today;

                                        return (
                                            <motion.div
                                                key={lead.id}
                                                layout
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="group bg-[#161616] border border-white/8 rounded-xl p-3 hover:border-white/20 transition-all shadow-sm space-y-2.5"
                                            >
                                                {/* Header & Source */}
                                                <div className="flex items-start justify-between gap-1">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-white leading-tight">
                                                            {lead.name}
                                                        </h4>
                                                        <span className="text-[10px] text-white/40">
                                                            vía {lead.source}
                                                        </span>
                                                    </div>
                                                    {lead.estimated_value && (
                                                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-1.5 py-0.5 rounded-lg shrink-0">
                                                            ${lead.estimated_value}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Interest or notes snippet */}
                                                {lead.interest && (
                                                    <p className="text-[11px] text-white/70 line-clamp-2 bg-white/[0.02] p-1.5 rounded-lg border border-white/5">
                                                        🎯 {lead.interest}
                                                    </p>
                                                )}

                                                {/* Follow-up date pill */}
                                                {lead.followup_date && (
                                                    <div className="flex items-center gap-1.5 text-[10px]">
                                                        <Calendar className="w-3 h-3 text-white/40" />
                                                        <span className={isDueToday ? 'text-[#F7931E] font-bold' : 'text-white/40'}>
                                                            {isDueToday ? '¡Seguimiento hoy!' : lead.followup_date}
                                                        </span>
                                                    </div>
                                                )}

                                                {/* Actions */}
                                                <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1">
                                                    {/* WhatsApp Button */}
                                                    {waUrl ? (
                                                        <a
                                                            href={waUrl}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            title="Escribir por WhatsApp"
                                                            className="flex items-center gap-1 text-[10px] text-emerald-400 hover:text-emerald-300 font-semibold px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 transition-colors"
                                                        >
                                                            <MessageCircle className="w-3 h-3" />
                                                            <span>Chat</span>
                                                        </a>
                                                    ) : (
                                                        <span />
                                                    )}

                                                    {/* Convert to Client Button (Prominent in Ganado or on request) */}
                                                    {lead.stage === 'ganado' ? (
                                                        <button
                                                            onClick={() => onConvertToClient(lead)}
                                                            className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#F7931E] hover:bg-[#F7931E]/90 px-2.5 py-1 rounded-lg shadow-sm transition-all"
                                                            title="Crear ficha en Suite"
                                                        >
                                                            <UserCheck className="w-3 h-3" />
                                                            <span>Crear Cliente</span>
                                                        </button>
                                                    ) : (
                                                        <div className="relative">
                                                            <select
                                                                value={lead.stage}
                                                                onChange={e => onUpdateLead(lead.id, { stage: e.target.value as LeadStage })}
                                                                className="appearance-none bg-[#222222] border border-white/10 rounded-lg text-[9px] font-medium text-white/70 pl-2 pr-5 py-0.5 outline-none cursor-pointer hover:border-white/20"
                                                            >
                                                                {LEAD_STAGES.map(s => (
                                                                    <option key={s.key} value={s.key} className="bg-[#1A1A1A] text-white">
                                                                        ➔ {s.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-white/40" />
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>

                                {stageLeads.length === 0 && (
                                    <div className="text-center py-8 text-white/20 text-[11px] border border-dashed border-white/5 rounded-xl">
                                        Sin prospectos
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal: Nuevo Prospecto */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#F7931E]/20 text-[#F7931E] flex items-center justify-center font-bold">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-sm">Nuevo Prospecto (Lead)</h3>
                                        <p className="text-white/40 text-[10px]">Registra un contacto que llegó por redes o referido</p>
                                    </div>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold">Nombre o Marca *</label>
                                    <input
                                        required
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        placeholder="Ej: Odontología Integral / Carlos Pérez"
                                        className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">WhatsApp (con código)</label>
                                        <input
                                            value={newPhone}
                                            onChange={e => setNewPhone(e.target.value)}
                                            placeholder="+584121234567"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Canal de Origen</label>
                                        <select
                                            value={newSource}
                                            onChange={e => setNewSource(e.target.value as any)}
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                                        >
                                            {LEAD_SOURCES.map(src => (
                                                <option key={src} value={src}>{src}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={e => setNewEmail(e.target.value)}
                                            placeholder="cliente@ejemplo.com"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Valor Estimado ($ USD)</label>
                                        <input
                                            type="number"
                                            value={newVal}
                                            onChange={e => setNewVal(e.target.value)}
                                            placeholder="350"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold">Servicio o Interés</label>
                                    <input
                                        value={newInterest}
                                        onChange={e => setNewInterest(e.target.value)}
                                        placeholder="Ej: Manejo de redes 12 reels al mes + pauta"
                                        className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Próxima Acción</label>
                                        <input
                                            value={newNextAction}
                                            onChange={e => setNewNextAction(e.target.value)}
                                            placeholder="Enviar propuesta económica"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Fecha de Seguimiento</label>
                                        <input
                                            type="date"
                                            value={newFollowup}
                                            onChange={e => setNewFollowup(e.target.value)}
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold">Notas o Contexto</label>
                                    <textarea
                                        value={newNotes}
                                        onChange={e => setNewNotes(e.target.value)}
                                        placeholder="Detalles de la conversación..."
                                        rows={2}
                                        className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 outline-none focus:border-[#F7931E]/50 resize-none"
                                    />
                                </div>

                                <div className="pt-3 border-t border-white/10 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setModalOpen(false)}
                                        className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-5 py-2 text-xs font-bold shadow-md shadow-[#F7931E]/20 transition-all"
                                    >
                                        Guardar Prospecto
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
