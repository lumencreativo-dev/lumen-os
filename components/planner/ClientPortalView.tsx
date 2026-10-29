'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Check, AlertCircle, Clock, Calendar, BarChart3,
    Sparkles, MessageSquare, ExternalLink, Copy, CheckCheck,
    MessageCircle, AlertTriangle, ChevronRight, ChevronLeft,
    Eye, ShieldCheck, Flame, Info
} from 'lucide-react';
import { PlannerClient, PlannerItem, SuiteMetric, RevisionRecord } from './types';
import { FMTS, STATUS_BADGE_STYLES, FMT_STYLES, PLATFORM_PILLS, todayStr, MONTHS } from './constants';
import { MediaPreview } from './MediaPreview';

interface ClientPortalViewProps {
    client: PlannerClient;
    items: PlannerItem[];
    metrics?: SuiteMetric[];
    onUpdateItem: (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => Promise<void>;
    onShowToast: (msg: string) => void;
}

export function ClientPortalView({
    client,
    items,
    metrics = [],
    onUpdateItem,
    onShowToast
}: ClientPortalViewProps) {
    const [activeTab, setActiveTab] = useState<'approvals' | 'calendar' | 'metrics'>('approvals');
    const [curMonth, setCurMonth] = useState(new Date().getMonth());
    const [curYear, setCurYear] = useState(new Date().getFullYear());
    const [selectedItemForReview, setSelectedItemForReview] = useState<PlannerItem | null>(null);
    const [feedbackModalItem, setFeedbackModalItem] = useState<PlannerItem | null>(null);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const maxRevisions = client.max_revisions ?? 2;
    const today = todayStr();

    // Items pending approval
    const pendingApprovalItems = useMemo(() => {
        return items
            .filter(i => i.client_id === client.id && i.status === 'Por aprobar')
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [items, client.id]);

    // Items already approved or scheduled
    const approvedOrScheduledItems = useMemo(() => {
        return items
            .filter(i => i.client_id === client.id && (i.status === 'Aprobado' || i.status === 'Programado' || i.status === 'Publicado'))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [items, client.id]);

    // Month items for calendar view
    const monthPrefix = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`;
    const monthItems = useMemo(() => {
        return items
            .filter(i => i.client_id === client.id && i.date.startsWith(monthPrefix))
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [items, client.id, monthPrefix]);

    // Client metrics for current period
    const clientMetrics = useMemo(() => {
        return metrics.filter(m => m.client_id === client.id);
    }, [metrics, client.id]);

    // Approve an item
    const handleApprove = async (item: PlannerItem) => {
        setIsSubmitting(true);
        try {
            await onUpdateItem(item.id, {
                status: 'Aprobado',
                approved_at: new Date().toISOString(),
                approved_by: client.name
            }, item.rule);
            onShowToast(`🎉 ¡Pieza "${item.title || 'Contenido'}" aprobada con éxito!`);
            if (selectedItemForReview?.id === item.id) {
                setSelectedItemForReview(null);
            }
        } catch (e: any) {
            onShowToast('Error al aprobar: ' + e?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Request adjustments
    const handleSubmitFeedback = async () => {
        if (!feedbackModalItem || !feedbackText.trim()) return;
        const currentCount = feedbackModalItem.revision_count ?? 0;
        if (currentCount >= maxRevisions) {
            onShowToast('Has alcanzado el límite de ajustes para esta pieza');
            return;
        }

        setIsSubmitting(true);
        const newRecord: RevisionRecord = {
            round: currentCount + 1,
            date: new Date().toISOString(),
            feedback: feedbackText.trim()
        };

        const existingHistory = feedbackModalItem.revision_history || [];

        try {
            await onUpdateItem(feedbackModalItem.id, {
                status: 'Corregir',
                revision_count: currentCount + 1,
                revision_history: [...existingHistory, newRecord]
            }, feedbackModalItem.rule);

            onShowToast(`📝 Ajustes enviados para la pieza (Ronda ${currentCount + 1} de ${maxRevisions})`);
            setFeedbackModalItem(null);
            setFeedbackText('');
            if (selectedItemForReview?.id === feedbackModalItem.id) {
                setSelectedItemForReview(null);
            }
        } catch (e: any) {
            onShowToast('Error al enviar ajustes: ' + e?.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        onShowToast('Copy copiado al portapapeles');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const whatsappLink = client.contact_phone
        ? `https://wa.me/${client.contact_phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hola Lumen Creativo, tengo una consulta sobre las publicaciones de ${client.name}`)}`
        : 'https://wa.me/584120000000';

    return (
        <div className="space-y-6">
            {/* ══ VIP Client Header ══ */}
            <div className="bg-gradient-to-r from-[#141414] via-[#161616] to-[#141414] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 overflow-hidden shadow-xl ring-2 ring-white/10"
                            style={{ backgroundColor: client.color }}
                        >
                            {client.avatar ? (
                                <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                            ) : (
                                client.name[0]?.toUpperCase() ?? '?'
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F7931E] bg-[#F7931E]/10 border border-[#F7931E]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Portal de Cliente
                                </span>
                                <span className="text-white/30 text-xs">· Lumen Creativo</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
                                {client.name}
                            </h1>
                            <p className="text-white/50 text-xs sm:text-sm mt-0.5">
                                Revisa, aprueba y supervisa los contenidos de tu marca.
                            </p>
                        </div>
                    </div>

                    {/* Support Button */}
                    <div className="flex items-center gap-3">
                        <a
                            href={whatsappLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all shadow-md"
                        >
                            <MessageCircle className="w-4 h-4" />
                            <span>Contacto con Ejecutivo</span>
                        </a>
                    </div>
                </div>

                {/* Portal Navigation Tabs */}
                <div className="flex items-center gap-2 mt-8 pt-5 border-t border-white/5 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('approvals')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === 'approvals'
                                ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                        }`}
                    >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Por Aprobar</span>
                        {pendingApprovalItems.length > 0 && (
                            <span className="w-5 h-5 rounded-full bg-white text-[#F7931E] font-black text-[11px] flex items-center justify-center">
                                {pendingApprovalItems.length}
                            </span>
                        )}
                    </button>

                    <button
                        onClick={() => setActiveTab('calendar')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === 'calendar'
                                ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                        }`}
                    >
                        <Calendar className="w-4 h-4" />
                        <span>Calendario de Contenidos</span>
                        <span className="text-white/40 text-[11px]">({approvedOrScheduledItems.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveTab('metrics')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
                            activeTab === 'metrics'
                                ? 'bg-[#F7931E] text-white shadow-lg shadow-[#F7931E]/20'
                                : 'text-white/60 hover:text-white bg-white/5 hover:bg-white/10'
                        }`}
                    >
                        <BarChart3 className="w-4 h-4" />
                        <span>Métricas y Rendimiento</span>
                    </button>
                </div>
            </div>

            {/* ══ TAB 1: APROBACIONES ══ */}
            {activeTab === 'approvals' && (
                <div className="space-y-6">
                    {/* Welcome banner if there are approvals */}
                    {pendingApprovalItems.length > 0 ? (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-[#F7931E] flex items-center justify-center shrink-0">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm">
                                        Tienes {pendingApprovalItems.length} pieza{pendingApprovalItems.length !== 1 ? 's' : ''} pendiente{pendingApprovalItems.length !== 1 ? 's' : ''} de revisión
                                    </h3>
                                    <p className="text-white/50 text-xs">
                                        Revisa el material gráfico/audiovisual y el texto de cada publicación. Tienes hasta <strong>{maxRevisions} rondas de ajustes</strong> por pieza.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-[#141414] border border-white/5 rounded-3xl p-8">
                            <div className="w-16 h-16 rounded-3xl bg-green-500/15 text-green-400 flex items-center justify-center mx-auto mb-4 border border-green-500/30">
                                <Check className="w-8 h-8" />
                            </div>
                            <h2 className="text-white font-black text-xl mb-1">¡Todo al día!</h2>
                            <p className="text-white/50 text-xs sm:text-sm max-w-md mx-auto">
                                No tienes piezas pendientes de aprobación en este momento. El equipo creativo está preparando los próximos contenidos.
                            </p>
                            <button
                                onClick={() => setActiveTab('calendar')}
                                className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all"
                            >
                                <Calendar className="w-4 h-4" /> Ver calendario completo
                            </button>
                        </div>
                    )}

                    {/* Pending Items Cards Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {pendingApprovalItems.map(item => {
                            const fmt = FMTS.find(f => f.name === item.fmt);
                            const fmtStyle = FMT_STYLES[item.fmt] || FMT_STYLES['Post'];
                            const revCount = item.revision_count ?? 0;
                            const hasReachedLimit = revCount >= maxRevisions;
                            const remainingRevs = Math.max(0, maxRevisions - revCount);

                            return (
                                <div
                                    key={item.id}
                                    className="bg-[#141414] border border-white/10 hover:border-white/20 rounded-3xl p-6 transition-all flex flex-col justify-between gap-5 shadow-xl group"
                                >
                                    <div className="space-y-4">
                                        {/* Card Top: Format, Date, Platforms */}
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`px-3 py-1 rounded-xl text-xs font-bold border ${fmtStyle.bg} ${fmtStyle.text} ${fmtStyle.border}`}
                                                >
                                                    {item.fmt}
                                                </span>
                                                <span className="text-white/40 text-xs font-semibold">
                                                    📅 {new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    {item.hour && ` · ${item.hour}`}
                                                </span>
                                            </div>

                                            {/* Revisions badge */}
                                            <div
                                                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5 border ${
                                                    hasReachedLimit
                                                        ? 'bg-red-500/15 border-red-500/30 text-red-300'
                                                        : revCount > 0
                                                        ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                                                        : 'bg-white/5 border-white/10 text-white/50'
                                                }`}
                                            >
                                                <AlertCircle className="w-3 h-3" />
                                                <span>Ajustes: {revCount} / {maxRevisions}</span>
                                            </div>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-white font-black text-lg group-hover:text-[#F7931E] transition-colors">
                                            {item.title || 'Contenido sin título'}
                                        </h3>

                                        {/* Media Preview (Google Drive / Video / Image) */}
                                        <MediaPreview
                                            url={item.material_link || item.canva_link}
                                            title={item.title}
                                            className="w-full"
                                        />

                                        {/* Platforms Pills */}
                                        {item.platforms && item.platforms.length > 0 && (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-[11px] text-white/40 mr-1">Publicar en:</span>
                                                {item.platforms.map(p => {
                                                    const pInfo = PLATFORM_PILLS[p] || { label: p, bg: 'bg-white/5', text: 'text-white/70', border: 'border-white/10' };
                                                    return (
                                                        <span
                                                            key={p}
                                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${pInfo.bg} ${pInfo.text} ${pInfo.border}`}
                                                        >
                                                            {pInfo.label}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Copy Text Preview with Copy button */}
                                        {item.copy && (
                                            <div className="bg-[#181818] border border-white/5 rounded-2xl p-4 space-y-2">
                                                <div className="flex items-center justify-between text-xs text-white/40 font-semibold">
                                                    <span>Texto / Copy del post:</span>
                                                    <button
                                                        onClick={() => handleCopyCopy(item.copy || '', item.id)}
                                                        className="hover:text-white flex items-center gap-1 text-[11px] text-[#F7931E]"
                                                    >
                                                        {copiedId === item.id ? <CheckCheck className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                                                        <span>{copiedId === item.id ? 'Copiado' : 'Copiar texto'}</span>
                                                    </button>
                                                </div>
                                                <p className="text-white/80 text-xs sm:text-sm whitespace-pre-wrap line-clamp-4 font-normal leading-relaxed">
                                                    {item.copy}
                                                </p>
                                            </div>
                                        )}

                                        {/* Hashtags or CTA */}
                                        {(item.hashtags || item.cta) && (
                                            <div className="flex flex-wrap gap-2 text-xs text-white/50">
                                                {item.cta && (
                                                    <span className="bg-white/5 px-2.5 py-1 rounded-xl">
                                                        <strong className="text-white/70">CTA:</strong> {item.cta}
                                                    </span>
                                                )}
                                                {item.hashtags && (
                                                    <span className="bg-white/5 px-2.5 py-1 rounded-xl truncate max-w-full">
                                                        <strong className="text-[#F7931E]/70">Tags:</strong> {item.hashtags}
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* Revision History if exists */}
                                        {item.revision_history && item.revision_history.length > 0 && (
                                            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 space-y-2">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                                                    <MessageSquare className="w-3.5 h-3.5" />
                                                    <span>Historial de ajustes solicitados:</span>
                                                </div>
                                                <div className="space-y-1.5">
                                                    {item.revision_history.map(r => (
                                                        <div key={r.round} className="text-[11px] text-white/70 bg-black/40 rounded-xl p-2.5">
                                                            <div className="flex items-center justify-between text-white/40 mb-1">
                                                                <span className="font-bold text-amber-300">Ronda #{r.round}</span>
                                                                <span>{new Date(r.date).toLocaleDateString('es-ES')}</span>
                                                            </div>
                                                            <p className="whitespace-pre-wrap">{r.feedback}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons: Approve vs Request Adjustments */}
                                    <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row gap-3">
                                        {/* Green Big Approve Button */}
                                        <button
                                            onClick={() => handleApprove(item)}
                                            disabled={isSubmitting}
                                            className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                                        >
                                            <Check className="w-4 h-4" />
                                            <span>Aprobar Pieza</span>
                                        </button>

                                        {/* Request Changes Button */}
                                        <button
                                            onClick={() => {
                                                if (!hasReachedLimit) {
                                                    setFeedbackModalItem(item);
                                                    setFeedbackText('');
                                                }
                                            }}
                                            disabled={isSubmitting || hasReachedLimit}
                                            className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                                hasReachedLimit
                                                    ? 'bg-white/5 border border-white/5 text-white/30 cursor-not-allowed'
                                                    : 'bg-white/5 hover:bg-white/10 border border-white/10 text-amber-400 hover:border-amber-400/40'
                                            }`}
                                        >
                                            <AlertCircle className="w-4 h-4" />
                                            <span>
                                                {hasReachedLimit ? 'Sin ajustes disp.' : `Pedir Ajustes (${remainingRevs} disp.)`}
                                            </span>
                                        </button>
                                    </div>

                                    {/* Notice when limit reached */}
                                    {hasReachedLimit && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between gap-3 text-xs text-red-300">
                                            <span>Has alcanzado el límite de {maxRevisions} rondas incluidas.</span>
                                            <a
                                                href={whatsappLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="underline font-bold text-white shrink-0 hover:text-red-200"
                                            >
                                                Contactar por WhatsApp
                                            </a>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ══ TAB 2: CALENDARIO DE CONTENIDOS ══ */}
            {activeTab === 'calendar' && (
                <div className="space-y-6">
                    {/* Month selector */}
                    <div className="flex items-center justify-between bg-[#141414] border border-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setCurMonth(m => (m === 0 ? 11 : m - 1))}
                                className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <h2 className="text-lg font-black text-white">
                                {MONTHS[curMonth]} {curYear}
                            </h2>
                            <button
                                onClick={() => setCurMonth(m => (m === 11 ? 0 : m + 1))}
                                className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <span className="text-white/40 text-xs font-semibold">
                            {monthItems.length} publicaciones este mes
                        </span>
                    </div>

                    {/* Content List for this month */}
                    {monthItems.length === 0 ? (
                        <div className="text-center py-16 bg-[#141414] border border-white/5 rounded-2xl text-white/30 text-xs">
                            No hay contenidos programados para {MONTHS[curMonth]} de {curYear}.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {monthItems.map(item => {
                                const fmt = FMTS.find(f => f.name === item.fmt);
                                const statusStyle = STATUS_BADGE_STYLES[item.status] || STATUS_BADGE_STYLES['Idea'];

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItemForReview(item)}
                                        className="bg-[#141414] border border-white/10 hover:border-white/25 rounded-2xl p-4 cursor-pointer transition-all hover:bg-[#181818] flex flex-col justify-between gap-3 group"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-bold text-white/50">
                                                    📅 {item.date}
                                                </span>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle}`}>
                                                    {item.status}
                                                </span>
                                            </div>
                                            <h4 className="text-white font-bold text-sm group-hover:text-[#F7931E] transition-colors truncate">
                                                {item.title || 'Sin título'}
                                            </h4>
                                            {item.copy && (
                                                <p className="text-white/50 text-xs line-clamp-2 mt-1">
                                                    {item.copy}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] text-white/40">
                                            {fmt && (
                                                <span className="font-bold" style={{ color: fmt.color }}>
                                                    {fmt.name}
                                                </span>
                                            )}
                                            <span className="flex items-center gap-1 group-hover:text-white transition-colors">
                                                <Eye className="w-3.5 h-3.5" /> Ver detalle
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ══ TAB 3: MÉTRICAS Y RENDIMIENTO ══ */}
            {activeTab === 'metrics' && (
                <div className="space-y-6">
                    {clientMetrics.length === 0 ? (
                        <div className="text-center py-20 bg-[#141414] border border-white/5 rounded-3xl p-8">
                            <BarChart3 className="w-12 h-12 text-[#F7931E]/40 mx-auto mb-3" />
                            <h3 className="text-white font-bold text-base mb-1">Métricas en consolidación</h3>
                            <p className="text-white/40 text-xs max-w-sm mx-auto">
                                El equipo de Lumen Creativo actualizará el reporte de métricas al cierre del período mensual actual.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {clientMetrics.map(m => (
                                <div key={m.id} className="bg-[#141414] border border-white/10 rounded-2xl p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-white text-base">{m.platform}</span>
                                        <span className="text-xs text-white/40 bg-white/5 px-2.5 py-1 rounded-xl">
                                            {m.period}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-white/4 rounded-xl p-3">
                                            <span className="text-[11px] text-white/40">Seguidores</span>
                                            <p className="text-lg font-black text-white">{m.followers.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/4 rounded-xl p-3">
                                            <span className="text-[11px] text-white/40">Alcance</span>
                                            <p className="text-lg font-black text-[#F7931E]">{m.reach.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/4 rounded-xl p-3">
                                            <span className="text-[11px] text-white/40">Interacciones</span>
                                            <p className="text-lg font-black text-blue-400">{m.engagement.toLocaleString()}</p>
                                        </div>
                                        <div className="bg-white/4 rounded-xl p-3">
                                            <span className="text-[11px] text-white/40">Clics / Enlaces</span>
                                            <p className="text-lg font-black text-emerald-400">{m.clicks.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    {m.notes && (
                                        <p className="text-xs text-white/60 bg-black/30 rounded-xl p-3 border border-white/5">
                                            💡 {m.notes}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ══ MODAL DE SOLICITUD DE AJUSTES ══ */}
            <AnimatePresence>
                {feedbackModalItem && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setFeedbackModalItem(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#161616] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                                        <AlertCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-base">Solicitar Ajustes</h3>
                                        <p className="text-white/40 text-xs">
                                            Ronda {(feedbackModalItem.revision_count ?? 0) + 1} de {maxRevisions} permitidas
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setFeedbackModalItem(null)}
                                    className="text-white/40 hover:text-white p-1 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300">
                                ℹ️ Al enviar estos comentarios, la pieza volverá al equipo de diseño con estado <strong>"Corregir"</strong> y se descontará 1 ronda de ajustes.
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-white/70">
                                    Detalla los cambios requeridos:
                                </label>
                                <textarea
                                    value={feedbackText}
                                    onChange={e => setFeedbackText(e.target.value)}
                                    placeholder="Ej: Por favor ajustar el texto del minuto 0:15, cambiar el color del titular a blanco y corregir el número de teléfono en la descripción..."
                                    rows={5}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl p-3.5 text-xs sm:text-sm text-white placeholder-white/30 outline-none focus:border-[#F7931E] transition-all resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    onClick={() => setFeedbackModalItem(null)}
                                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSubmitFeedback}
                                    disabled={!feedbackText.trim() || isSubmitting}
                                    className="px-5 py-2.5 rounded-xl bg-[#F7931E] hover:bg-[#F7931E]/90 disabled:opacity-40 text-white text-xs font-bold shadow-lg shadow-[#F7931E]/20 transition-all flex items-center gap-1.5"
                                >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Enviar a Corrección</span>
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* ══ MODAL DE DETALLE DE PIEZA (CALENDARIO) ══ */}
            <AnimatePresence>
                {selectedItemForReview && (
                    <div
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setSelectedItemForReview(null)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onClick={e => e.stopPropagation()}
                            className="bg-[#161616] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-white/40">📅 {selectedItemForReview.date}</span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${STATUS_BADGE_STYLES[selectedItemForReview.status]}`}>
                                        {selectedItemForReview.status}
                                    </span>
                                </div>
                                <button
                                    onClick={() => setSelectedItemForReview(null)}
                                    className="text-white/40 hover:text-white p-1 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <h3 className="text-white font-black text-xl">
                                {selectedItemForReview.title || 'Sin título'}
                            </h3>

                            <MediaPreview
                                url={selectedItemForReview.material_link || selectedItemForReview.canva_link}
                                title={selectedItemForReview.title}
                            />

                            {selectedItemForReview.copy && (
                                <div className="bg-black/40 border border-white/5 rounded-2xl p-4 space-y-2">
                                    <div className="flex items-center justify-between text-xs text-white/40">
                                        <span>Texto / Copy del post</span>
                                        <button
                                            onClick={() => handleCopyCopy(selectedItemForReview.copy || '', selectedItemForReview.id)}
                                            className="text-[#F7931E] hover:text-white text-xs font-semibold"
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    <p className="text-white/80 text-xs sm:text-sm whitespace-pre-wrap">
                                        {selectedItemForReview.copy}
                                    </p>
                                </div>
                            )}

                            {selectedItemForReview.status === 'Por aprobar' && (
                                <div className="pt-2 flex gap-3">
                                    <button
                                        onClick={() => handleApprove(selectedItemForReview)}
                                        className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs py-3 rounded-2xl shadow-md flex items-center justify-center gap-2"
                                    >
                                        <Check className="w-4 h-4" /> Aprobar Pieza
                                    </button>
                                    <button
                                        onClick={() => {
                                            setFeedbackModalItem(selectedItemForReview);
                                            setSelectedItemForReview(null);
                                        }}
                                        className="px-4 py-3 bg-white/5 border border-white/10 text-amber-400 text-xs font-bold rounded-2xl hover:bg-white/10"
                                    >
                                        Pedir Ajustes
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
