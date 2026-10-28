'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BarChart3, Plus, Download, TrendingUp, Users,
    Eye, MousePointer, MessageSquare, Instagram,
    Facebook, Share2, Sparkles, ChevronDown, Check, X
} from 'lucide-react';
import { PlannerClient, SuiteMetric } from './types';
import { PLATFORMS_LIST, uid } from './constants';

interface MetricsViewProps {
    clients: PlannerClient[];
    metrics: SuiteMetric[];
    onSaveMetric: (metric: Omit<SuiteMetric, 'id' | 'created_at'>) => void;
}

export function MetricsView({
    clients,
    metrics,
    onSaveMetric
}: MetricsViewProps) {
    const currentPeriod = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
    const [selectedClient, setSelectedClient] = useState<string>(clients[0]?.id || '');
    const [selectedPeriod, setSelectedPeriod] = useState<string>(currentPeriod);
    const [modalOpen, setModalOpen] = useState(false);

    // Form inputs for registering metric
    const [formPlatform, setFormPlatform] = useState<SuiteMetric['platform']>('Instagram');
    const [formFollowers, setFormFollowers] = useState('');
    const [formReach, setFormReach] = useState('');
    const [formImpressions, setFormImpressions] = useState('');
    const [formInteractions, setFormInteractions] = useState('');
    const [formClicks, setFormClicks] = useState('');
    const [formMessages, setFormMessages] = useState('');
    const [formNotes, setFormNotes] = useState('');

    const activeClient = clients.find(c => c.id === selectedClient);
    const clientMetrics = metrics.filter(m => m.client_id === selectedClient && m.period === selectedPeriod);

    // Aggregate totals for the selected client and period
    const totalReach = clientMetrics.reduce((acc, m) => acc + (m.reach || 0), 0);
    const totalInteractions = clientMetrics.reduce((acc, m) => acc + (m.interactions || 0), 0);
    const totalClicks = clientMetrics.reduce((acc, m) => acc + (m.clicks || 0), 0);
    const totalFollowers = clientMetrics.reduce((acc, m) => acc + (m.followers || 0), 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedClient) return;

        onSaveMetric({
            client_id: selectedClient,
            platform: formPlatform,
            period: selectedPeriod,
            followers: formFollowers ? Number(formFollowers) : undefined,
            reach: formReach ? Number(formReach) : undefined,
            impressions: formImpressions ? Number(formImpressions) : undefined,
            interactions: formInteractions ? Number(formInteractions) : undefined,
            clicks: formClicks ? Number(formClicks) : undefined,
            messages: formMessages ? Number(formMessages) : undefined,
            notes: formNotes.trim() || undefined
        });

        // Reset
        setFormFollowers('');
        setFormReach('');
        setFormImpressions('');
        setFormInteractions('');
        setFormClicks('');
        setFormMessages('');
        setFormNotes('');
        setModalOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header & Client Selector */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#141414] border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400">
                        <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-sm">Métricas de Redes Sociales</h2>
                        <p className="text-white/40 text-xs">Registra y analiza el rendimiento mensual de cada cliente</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                    {/* Client select */}
                    <div className="relative">
                        <select
                            value={selectedClient}
                            onChange={e => setSelectedClient(e.target.value)}
                            className="appearance-none bg-[#1A1A1A] border border-white/10 rounded-xl text-xs font-semibold text-white pl-3 pr-8 py-2 outline-none focus:border-[#F7931E]/50 cursor-pointer"
                        >
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
                    </div>

                    {/* Period input */}
                    <input
                        type="month"
                        value={selectedPeriod}
                        onChange={e => setSelectedPeriod(e.target.value)}
                        className="bg-[#1A1A1A] border border-white/10 rounded-xl text-xs font-semibold text-white px-3 py-1.5 outline-none"
                    />

                    <button
                        onClick={() => setModalOpen(true)}
                        className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-4 py-2 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-[#F7931E]/20 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" /> Registrar Métricas
                    </button>
                </div>
            </div>

            {/* Quick KPI Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-white/40 text-xs font-medium">
                        <span>Alcance Total</span>
                        <Eye className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-2xl font-black text-white mt-1">
                        {totalReach > 0 ? totalReach.toLocaleString() : '—'}
                    </div>
                    <span className="text-[10px] text-white/30">Cuentas alcanzadas en el período</span>
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-white/40 text-xs font-medium">
                        <span>Interacciones</span>
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="text-2xl font-black text-emerald-400 mt-1">
                        {totalInteractions > 0 ? totalInteractions.toLocaleString() : '—'}
                    </div>
                    <span className="text-[10px] text-white/30">Likes, comentarios, guardados</span>
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-white/40 text-xs font-medium">
                        <span>Clics al Enlace</span>
                        <MousePointer className="w-4 h-4 text-[#F7931E]" />
                    </div>
                    <div className="text-2xl font-black text-[#F7931E] mt-1">
                        {totalClicks > 0 ? totalClicks.toLocaleString() : '—'}
                    </div>
                    <span className="text-[10px] text-white/30">Tráfico generado al link</span>
                </div>
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between text-white/40 text-xs font-medium">
                        <span>Seguidores / Comunidad</span>
                        <Users className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="text-2xl font-black text-purple-300 mt-1">
                        {totalFollowers > 0 ? totalFollowers.toLocaleString() : '—'}
                    </div>
                    <span className="text-[10px] text-white/30">Audiencia acumulada</span>
                </div>
            </div>

            {/* Platform Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'YouTube'] as const).map(platform => {
                    const record = clientMetrics.find(m => m.platform === platform);
                    return (
                        <div
                            key={platform}
                            className="bg-[#141414] border border-white/8 rounded-2xl p-5 space-y-4 shadow-sm"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <span className="text-sm font-bold text-white flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
                                    {platform}
                                </span>
                                {record ? (
                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                        Registrado
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-white/30">Sin datos</span>
                                )}
                            </div>

                            {record ? (
                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                        <span className="text-white/40 text-[10px]">Seguidores</span>
                                        <div className="font-bold text-white mt-0.5">
                                            {record.followers?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                        <span className="text-white/40 text-[10px]">Alcance</span>
                                        <div className="font-bold text-blue-400 mt-0.5">
                                            {record.reach?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                        <span className="text-white/40 text-[10px]">Interacciones</span>
                                        <div className="font-bold text-emerald-400 mt-0.5">
                                            {record.interactions?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    <div className="bg-white/[0.02] p-2.5 rounded-xl border border-white/5">
                                        <span className="text-white/40 text-[10px]">Clics</span>
                                        <div className="font-bold text-[#F7931E] mt-0.5">
                                            {record.clicks?.toLocaleString() || '0'}
                                        </div>
                                    </div>
                                    {record.notes && (
                                        <p className="col-span-2 text-[11px] text-white/60 italic mt-1">
                                            "{record.notes}"
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-white/20 text-xs">
                                    No has cargado métricas de {platform} en este mes.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Modal para Registrar Métricas */}
            <AnimatePresence>
                {modalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setModalOpen(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#141414] border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl"
                        >
                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                <div>
                                    <h3 className="text-white font-bold text-sm">Registrar Métricas</h3>
                                    <p className="text-white/40 text-[10px]">Para {activeClient?.name || 'Cliente'} · {selectedPeriod}</p>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="text-white/40 hover:text-white p-1">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold">Plataforma</label>
                                    <select
                                        value={formPlatform}
                                        onChange={e => setFormPlatform(e.target.value as any)}
                                        className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer"
                                    >
                                        {(['Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'YouTube'] as const).map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Seguidores</label>
                                        <input
                                            type="number"
                                            value={formFollowers}
                                            onChange={e => setFormFollowers(e.target.value)}
                                            placeholder="Ej: 12500"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Alcance</label>
                                        <input
                                            type="number"
                                            value={formReach}
                                            onChange={e => setFormReach(e.target.value)}
                                            placeholder="Ej: 45000"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Interacciones</label>
                                        <input
                                            type="number"
                                            value={formInteractions}
                                            onChange={e => setFormInteractions(e.target.value)}
                                            placeholder="Ej: 3200"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-white/50 uppercase font-bold">Clics al enlace</label>
                                        <input
                                            type="number"
                                            value={formClicks}
                                            onChange={e => setFormClicks(e.target.value)}
                                            placeholder="Ej: 480"
                                            className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] text-white/50 uppercase font-bold">Notas o Conclusiones</label>
                                    <textarea
                                        value={formNotes}
                                        onChange={e => setFormNotes(e.target.value)}
                                        placeholder="Ej: El reel del 15 de octubre duplicó el alcance..."
                                        rows={2}
                                        className="w-full mt-1 bg-[#1A1A1A] border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
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
                                        Guardar Métricas
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
