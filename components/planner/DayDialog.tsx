'use client';

import { useState } from 'react';
import {
    X, Plus, FileText, ArrowLeft, Clock, User, Target,
    Instagram, Hash, MousePointer, Eye, Link, ExternalLink, Trash2,
    ChevronDown, ChevronUp, Check, AlertCircle
} from 'lucide-react';
import { PlannerItem, PlannerMilestone } from './types';
import {
    FMTS, STATUSES, STATUS_COLORS, PLATFORMS_LIST, FREQ_LABEL,
    DAYS_FULL, MONTHS, fmtColor, safeHref, PLATFORM_PILLS
} from './constants';
import { ConfirmModal } from './ConfirmModal';
import { MediaPreview } from './MediaPreview';

interface DayDialogProps {
    mode: 'admin' | 'client';
    date: string;
    items: PlannerItem[];
    milestones: PlannerMilestone[];
    fichaItem: PlannerItem | null;
    setFichaItem: (item: PlannerItem | null) => void;
    onClose: () => void;
    onAdd: (date: string, freq?: string, initialData?: { title?: string; fmt?: string }) => void;
    onUpdate: (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => void;
    onDelete: (id: string, isRule?: boolean) => void;
}

export function DayDialog({
    mode,
    date,
    items,
    milestones,
    fichaItem,
    setFichaItem,
    onClose,
    onAdd,
    onUpdate,
    onDelete
}: DayDialogProps) {
    const [yStr, mStr, dStr] = date.split('-');
    const [y, m, day] = [Number(yStr), Number(mStr) - 1, Number(dStr)];
    const dayName = DAYS_FULL[new Date(y, m, day).getDay()];

    // Add content collapsible state
    const [showAddForm, setShowAddForm] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newFmt, setNewFmt] = useState('Post');
    const [newFreq, setNewFreq] = useState('');

    const handleCreate = () => {
        onAdd(date, newFreq || undefined, { title: newTitle.trim(), fmt: newFmt });
        setNewTitle('');
        setNewFreq('');
        setShowAddForm(false);
    };

    const backdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            if (fichaItem) setFichaItem(null);
            else onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 overflow-auto" onClick={backdropClick}>
            <div className="bg-[#121212] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl my-auto overflow-hidden">
                {fichaItem ? (
                    <FichaView
                        item={fichaItem}
                        date={date}
                        onBack={() => setFichaItem(null)}
                        onClose={onClose}
                        onUpdate={onUpdate}
                        onDelete={onDelete}
                        mode={mode}
                    />
                ) : (
                    <>
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-[#161616]">
                            <div>
                                <h2 className="font-black text-white text-base sm:text-lg capitalize">
                                    {dayName} {day} de {MONTHS[m].toLowerCase()}
                                </h2>
                                <p className="text-white/40 text-xs mt-0.5">{date}</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-3 max-h-[68vh] overflow-y-auto">
                            {/* Client Milestones / Efemérides */}
                            {milestones.length > 0 && (
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-2">
                                    <p className="text-amber-300 text-xs font-bold mb-1">⭐ Hitos / Fechas clave</p>
                                    <div className="space-y-1">
                                        {milestones.map(ms => (
                                            <div key={ms.id} className="text-amber-200 text-xs font-semibold flex items-center gap-1.5">
                                                <span>{ms.emoji || '⭐'}</span>
                                                <span>{ms.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Content Items List */}
                            {items.length === 0 ? (
                                <div className="text-center py-8 text-white/30 text-sm border border-dashed border-white/5 rounded-xl">
                                    No hay contenido programado para este día.
                                </div>
                            ) : (
                                items.map(it => (
                                    <ContentRowQuick
                                        key={it.id}
                                        item={it}
                                        mode={mode}
                                        onUpdate={onUpdate}
                                        onDelete={onDelete}
                                        onOpenFicha={() => setFichaItem(it)}
                                    />
                                ))
                            )}

                            {/* Collapsible Add Content Section (Admin Only) */}
                            {mode === 'admin' && (
                                <div className="pt-3 border-t border-white/10">
                                    {!showAddForm ? (
                                        <button
                                            type="button"
                                            onClick={() => setShowAddForm(true)}
                                            className="w-full py-2.5 px-4 rounded-xl border border-dashed border-white/20 hover:border-[#F7931E]/60 text-white/70 hover:text-white bg-white/3 hover:bg-[#F7931E]/10 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                        >
                                            <Plus className="w-4 h-4 text-[#F7931E]" />
                                            + Añadir contenido a este día
                                        </button>
                                    ) : (
                                        <div className="bg-[#181818] border border-white/15 rounded-xl p-3.5 space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                                    <Plus className="w-3.5 h-3.5 text-[#F7931E]" /> Nuevo contenido
                                                </span>
                                                <button
                                                    onClick={() => setShowAddForm(false)}
                                                    className="text-white/40 hover:text-white text-xs"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>

                                            <input
                                                value={newTitle}
                                                onChange={e => setNewTitle(e.target.value)}
                                                placeholder="Título o tema del contenido..."
                                                className="w-full bg-[#121212] border border-white/10 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-[#F7931E]/60 placeholder-white/30"
                                            />

                                            <div className="flex flex-wrap gap-2 items-center">
                                                <select
                                                    value={newFmt}
                                                    onChange={e => setNewFmt(e.target.value)}
                                                    className="bg-[#121212] border border-white/20 text-white font-semibold text-xs rounded-lg px-2.5 py-1.5 outline-none [color-scheme:dark]"
                                                >
                                                    {FMTS.map(f => (
                                                        <option key={f.name} value={f.name}>{f.name}</option>
                                                    ))}
                                                </select>

                                                <select
                                                    value={newFreq}
                                                    onChange={e => setNewFreq(e.target.value)}
                                                    className="bg-[#121212] border border-white/20 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none [color-scheme:dark]"
                                                >
                                                    <option value="">No se repite (Único)</option>
                                                    <option value="w">Repetir cada semana</option>
                                                    <option value="m">Repetir cada mes</option>
                                                    <option value="y">Repetir cada año</option>
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={handleCreate}
                                                    className="ml-auto bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-all shadow-md shadow-[#F7931E]/20"
                                                >
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Quick row in day dialog ────────────────────────────────────────────────────
function ContentRowQuick({ item, mode, onUpdate, onDelete, onOpenFicha }: any) {
    const color = fmtColor(item.fmt);
    const summary = [
        item.hour && item.hour,
        item.copy ? 'Con copy' : 'Sin copy',
        item.material_link ? 'Con material' : null,
    ].filter(Boolean).join(' · ');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    return (
        <div
            className="rounded-xl border transition-all p-3 space-y-2"
            style={{ borderColor: `${color}45`, backgroundColor: `${color}14` }}
        >
            <div className="flex items-start gap-3">
                <div className="w-1.5 self-stretch rounded-full shrink-0 mt-0.5" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0 space-y-1.5">
                    {/* Title */}
                    <div className="flex gap-2 items-center">
                        {mode === 'admin' ? (
                            <input
                                value={item.title}
                                onChange={e => onUpdate(item.id, { title: e.target.value }, item.rule)}
                                placeholder="Título / tema..."
                                className="flex-1 min-w-0 bg-transparent text-white text-sm font-bold outline-none placeholder-white/30"
                            />
                        ) : (
                            <span className="text-white text-sm font-bold flex-1 truncate">{item.title || item.fmt}</span>
                        )}
                    </div>

                    {/* Format, Status, Rule */}
                    <div className="flex flex-wrap gap-2 items-center">
                        {mode === 'admin' ? (
                            <select
                                value={item.fmt}
                                onChange={e => onUpdate(item.id, { fmt: e.target.value }, item.rule)}
                                className="bg-[#1C1C1C] border border-white/20 text-xs font-semibold rounded-lg px-2.5 py-1 outline-none [color-scheme:dark] [&>option]:bg-[#1C1C1C] cursor-pointer"
                                style={{ color }}
                            >
                                {FMTS.map(f => (
                                    <option key={f.name} value={f.name}>{f.name}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="text-xs font-semibold" style={{ color }}>{item.fmt}</span>
                        )}

                        {item.rule && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/10 text-white/70">
                                ↻ Recurrente
                            </span>
                        )}

                        {mode === 'admin' ? (
                            <select
                                value={item.status}
                                onChange={e => onUpdate(item.id, { status: e.target.value }, item.rule)}
                                className="bg-[#1C1C1C] border border-white/20 text-xs rounded-lg px-2.5 py-1 outline-none font-semibold [color-scheme:dark] [&>option]:bg-[#1C1C1C] cursor-pointer"
                                style={{ color: STATUS_COLORS[item.status] || '#9E9E9E' }}
                            >
                                {STATUSES.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        ) : (
                            <span
                                className="text-xs rounded-full px-2 py-0.5 font-bold"
                                style={{
                                    backgroundColor: `${STATUS_COLORS[item.status] || '#9E9E9E'}25`,
                                    color: STATUS_COLORS[item.status] || '#9E9E9E'
                                }}
                            >
                                {item.status}
                            </span>
                        )}

                        {/* Mini platform pills */}
                        {item.platforms && item.platforms.length > 0 && (
                            <div className="flex items-center gap-1 ml-auto">
                                {item.platforms.map((p: string) => {
                                    const pSt = PLATFORM_PILLS[p];
                                    return pSt ? (
                                        <span
                                            key={p}
                                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${pSt.bg} ${pSt.border} ${pSt.text}`}
                                        >
                                            {pSt.label}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                        )}
                    </div>

                    {/* Summary row + Ficha link */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                        <span className="text-white/60 text-xs font-medium truncate">
                            {summary || 'Sin detalles extra'}
                        </span>
                        <button
                            onClick={onOpenFicha}
                            className="shrink-0 text-xs text-[#F7931E] hover:text-[#F7931E]/80 font-bold transition-all flex items-center gap-1"
                        >
                            Ver ficha completa →
                        </button>
                    </div>
                </div>

                {mode === 'admin' && (
                    <button
                        onClick={() => setDeleteModalOpen(true)}
                        className="text-white/30 hover:text-red-400 p-1.5 shrink-0 transition-all rounded-lg hover:bg-white/5"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Confirmation modal before deleting */}
            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Eliminar contenido"
                message={`¿Estás seguro de que deseas eliminar "${item.title || item.fmt}"? ${item.rule ? 'Esta es una regla recurrente y se eliminarán todas sus repeticiones.' : ''}`}
                onConfirm={() => {
                    setDeleteModalOpen(false);
                    onDelete(item.id, item.rule);
                }}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </div>
    );
}

// ── Ficha Completa ─────────────────────────────────────────────────────────────
function FichaView({ item, date, onBack, onClose, onUpdate, onDelete, mode }: any) {
    const [yStr, mStr, dStr] = date.split('-');
    const [y, m, day] = [Number(yStr), Number(mStr) - 1, Number(dStr)];
    const dayName = DAYS_FULL[new Date(y, m, day).getDay()];
    const color = fmtColor(item.fmt);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    const field = (key: keyof PlannerItem, value: any) => onUpdate(item.id, { [key]: value }, item.rule);

    const togglePlatform = (p: string) => {
        const current = item.platforms ?? [];
        const next = current.includes(p) ? current.filter((x: string) => x !== p) : [...current, p];
        field('platforms', next);
    };

    const freqLabel = item.rule ? (FREQ_LABEL[item.freq || 'w'] || 'semana') : null;

    return (
        <>
            {/* Ficha header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/5 bg-[#161616]">
                <button
                    onClick={onBack}
                    className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs sm:text-sm font-semibold transition-all"
                >
                    <ArrowLeft className="w-4 h-4" /> Volver al día
                </button>
                <button
                    onClick={onClose}
                    className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content title header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
                <div className="flex items-start gap-3">
                    <div className="w-1.5 self-stretch rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                    <div>
                        <h3 className="text-white font-black text-lg">{item.title || 'Contenido sin título'}</h3>
                        <p className="text-white/40 text-xs mt-0.5 capitalize">
                            {dayName} {day} de {MONTHS[m].toLowerCase()} de {date.split('-')[0]}
                            {item.rule && freqLabel && ` · ↻ se repite cada ${freqLabel} (los cambios afectan a todas)`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form fields */}
            <div className="p-5 overflow-y-auto max-h-[60vh] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Status Banners: Approval / Corrections */}
                    {item.status === 'Aprobado' && (
                        <div className="md:col-span-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between text-xs text-teal-300">
                            <span className="flex items-center gap-2 font-bold">
                                <Check className="w-4 h-4 text-teal-400" /> Aprobado por el cliente
                                {item.approved_by && ` (${item.approved_by})`}
                            </span>
                            {item.approved_at && (
                                <span className="text-white/40 text-[11px]">{new Date(item.approved_at).toLocaleDateString('es-ES')}</span>
                            )}
                        </div>
                    )}

                    {item.revision_history && item.revision_history.length > 0 && (
                        <div className="md:col-span-2 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                                <span className="flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5" /> Ajustes solicitados por el cliente (Ronda {item.revision_count ?? item.revision_history.length})
                                </span>
                            </div>
                            <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                {item.revision_history.map(r => (
                                    <div key={r.round} className="bg-black/40 rounded-xl p-2.5 text-xs text-white/80">
                                        <div className="flex items-center justify-between text-[11px] text-white/40 mb-1">
                                            <span className="font-bold text-amber-300">Ronda #{r.round}</span>
                                            <span>{new Date(r.date).toLocaleDateString('es-ES')}</span>
                                        </div>
                                        <p className="whitespace-pre-wrap">{r.feedback}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 1. Titulo */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-[#F7931E]" /> Título / Tema
                        </label>
                        <input
                            value={item.title || ''}
                            onChange={e => field('title', e.target.value)}
                            placeholder="Título o concepto del contenido..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20"
                        />
                    </div>

                    {/* 2. Formato y Estado */}
                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold">Formato</label>
                        <select
                            value={item.fmt}
                            onChange={e => field('fmt', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 disabled:opacity-50 [color-scheme:dark] [&>option]:bg-[#1C1C1C] cursor-pointer"
                        >
                            {FMTS.map(f => (
                                <option key={f.name} value={f.name}>{f.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold">Estado</label>
                        <select
                            value={item.status}
                            onChange={e => field('status', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 disabled:opacity-50 [color-scheme:dark] [&>option]:bg-[#1C1C1C] cursor-pointer"
                        >
                            {STATUSES.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* 3. Hora y Responsable */}
                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-[#F7931E]" /> Hora de publicación
                        </label>
                        <input
                            type="time"
                            value={item.hour || ''}
                            onChange={e => field('hour', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-[#1C1C1C] border border-white/20 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 disabled:opacity-50 [color-scheme:dark]"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#F7931E]" /> Responsable
                        </label>
                        <input
                            value={item.responsible || ''}
                            onChange={e => field('responsible', e.target.value)}
                            placeholder="Quién lo crea/diseña..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                        />
                    </div>

                    {/* 4. Pilar */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-[#F7931E]" /> Pilar u Objetivo
                        </label>
                        <input
                            value={item.pillar || ''}
                            onChange={e => field('pillar', e.target.value)}
                            placeholder="Ej: Educar, Vender, Comunidad, Inspirar..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                        />
                    </div>

                    {/* 5. Plataformas Pills */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Instagram className="w-3 h-3 text-[#F7931E]" /> Plataformas
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS_LIST.map(p => {
                                const active = (item.platforms ?? []).includes(p);
                                const pSt = PLATFORM_PILLS[p];
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => mode === 'admin' && togglePlatform(p)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                            active
                                                ? `${pSt?.bg || 'bg-[#F7931E]/20'} ${pSt?.border || 'border-[#F7931E]/40'} ${pSt?.text || 'text-[#F7931E]'}`
                                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70'
                                        } ${mode === 'client' ? 'cursor-default' : 'cursor-pointer'}`}
                                    >
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 6. Copy */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <FileText className="w-3 h-3 text-[#F7931E]" /> Copy / Texto de la publicación
                        </label>
                        <textarea
                            value={item.copy || ''}
                            onChange={e => field('copy', e.target.value)}
                            placeholder="Escribe el texto que acompañará la publicación..."
                            rows={5}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 resize-none"
                        />
                    </div>

                    {/* 7. Hashtags */}
                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Hash className="w-3 h-3 text-[#F7931E]" /> Hashtags
                        </label>
                        <input
                            value={item.hashtags || ''}
                            onChange={e => field('hashtags', e.target.value)}
                            placeholder="#lumen #marketing..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                        />
                    </div>

                    {/* 8. CTA */}
                    <div className="space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <MousePointer className="w-3 h-3 text-[#F7931E]" /> Llamado a la acción
                        </label>
                        <input
                            value={item.cta || ''}
                            onChange={e => field('cta', e.target.value)}
                            placeholder="Ej: Visita el link en bio, Escribe HOY..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                        />
                    </div>

                    {/* 9. Idea visual */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Eye className="w-3 h-3 text-[#F7931E]" /> Idea visual / Guión / Indicaciones de diseño
                        </label>
                        <textarea
                            value={item.visual_idea || ''}
                            onChange={e => field('visual_idea', e.target.value)}
                            placeholder="Describe la imagen, referencia o guión del reel..."
                            rows={4}
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 resize-none disabled:opacity-50"
                        />
                    </div>

                    {/* 10. Material link (Drive / Canva) */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <Link className="w-3 h-3 text-[#F7931E]" /> Enlace al material (Canva, Drive...)
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={item.material_link || ''}
                                onChange={e => field('material_link', e.target.value)}
                                placeholder="https://canva.com/... o https://drive.google.com/..."
                                disabled={mode === 'client'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                            />
                            {safeHref(item.material_link) && (
                                <a
                                    href={safeHref(item.material_link)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 bg-[#F7931E]/10 border border-[#F7931E]/30 text-[#F7931E] hover:bg-[#F7931E]/20 text-xs px-3.5 rounded-xl font-bold transition-all"
                                >
                                    Abrir <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                        {item.material_link && (
                            <MediaPreview url={item.material_link} title={item.title} className="mt-2" />
                        )}
                    </div>

                    {/* 11. Published link */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold flex items-center gap-1.5">
                            <ExternalLink className="w-3 h-3 text-[#F7931E]" /> Enlace de la publicación ya publicada
                        </label>
                        <div className="flex gap-2">
                            <input
                                value={item.published_link || ''}
                                onChange={e => field('published_link', e.target.value)}
                                placeholder="https://instagram.com/p/..."
                                disabled={mode === 'client'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 disabled:opacity-50"
                            />
                            {safeHref(item.published_link) && (
                                <a
                                    href={safeHref(item.published_link)!}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white hover:bg-white/10 text-xs px-3.5 rounded-xl font-bold transition-all"
                                >
                                    Ver <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                            )}
                        </div>
                        {item.material_link && (
                            <MediaPreview url={item.material_link} title={item.title} className="mt-2" />
                        )}
                    </div>

                    {/* 12. Feedback / Comentarios del cliente */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/50 text-xs font-semibold">
                            Comentarios y correcciones del cliente
                        </label>
                        <textarea
                            value={item.note || ''}
                            onChange={e => field('note', e.target.value)}
                            placeholder="Notas o ajustes pedidos por el cliente..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/60 placeholder-white/20 resize-none"
                        />
                    </div>
                </div>

                {/* Delete button (Admin Only) */}
                {mode === 'admin' && (
                    <div className="pt-4 border-t border-white/5 flex justify-end">
                        <button
                            type="button"
                            onClick={() => setDeleteModalOpen(true)}
                            className="flex items-center gap-1.5 text-red-400/70 hover:text-red-400 text-xs font-semibold transition-all px-3 py-1.5 rounded-lg hover:bg-red-500/10"
                        >
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar este contenido
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={deleteModalOpen}
                title="Eliminar contenido"
                message={`¿Estás seguro de que deseas eliminar permanentemente "${item.title || item.fmt}"?`}
                onConfirm={() => {
                    setDeleteModalOpen(false);
                    onDelete(item.id, item.rule);
                }}
                onCancel={() => setDeleteModalOpen(false)}
            />
        </>
    );
}
