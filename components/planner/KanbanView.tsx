'use client';

import { useState } from 'react';
import { Calendar, Clock, User, ExternalLink, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PlannerItem } from './types';
import { STATUSES, STATUS_COLORS, STATUS_BADGE_STYLES, FMT_STYLES, PLATFORM_PILLS } from './constants';

interface KanbanViewProps {
    items: PlannerItem[];
    mode: 'admin' | 'client';
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
    onOpenDay: (date: string, item?: PlannerItem) => void;
}

export function KanbanView({ items, mode, onUpdateStatus, onOpenDay }: KanbanViewProps) {
    const [selectedFmt, setSelectedFmt] = useState<string>('all');

    const filteredItems = selectedFmt === 'all'
        ? items
        : items.filter(it => it.fmt === selectedFmt);

    return (
        <div className="space-y-4">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141414] border border-white/5 rounded-2xl p-3">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-0.5">
                    <span className="text-white/40 text-xs font-semibold px-2">Filtrar:</span>
                    <button
                        onClick={() => setSelectedFmt('all')}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            selectedFmt === 'all'
                                ? 'bg-white/20 text-white'
                                : 'text-white/50 hover:text-white bg-white/5'
                        }`}
                    >
                        Todos ({items.length})
                    </button>
                    {['Post', 'Carrusel', 'Historia', 'Reel'].map(fmt => {
                        const count = items.filter(i => i.fmt === fmt).length;
                        const st = FMT_STYLES[fmt] || { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', dot: '#FFFFFF' };
                        return (
                            <button
                                key={fmt}
                                onClick={() => setSelectedFmt(fmt)}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                    selectedFmt === fmt
                                        ? `${st.bg} ${st.border} ${st.text} border`
                                        : 'text-white/50 hover:text-white bg-white/5'
                                }`}
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: st.dot }} />
                                {fmt}s ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Kanban Columns */}
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
                {STATUSES.map(status => {
                    const colItems = filteredItems.filter(i => i.status === status);
                    const colColor = STATUS_COLORS[status] || '#9E9E9E';
                    const badgeSt = STATUS_BADGE_STYLES[status] || { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };

                    return (
                        <div
                            key={status}
                            className="min-w-[280px] max-w-[320px] flex-1 bg-[#141414] border border-white/5 rounded-2xl flex flex-col h-[75vh]"
                        >
                            {/* Column Header */}
                            <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colColor }} />
                                    <h3 className="font-bold text-white text-sm tracking-wide">{status}</h3>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeSt.bg} ${badgeSt.border} ${badgeSt.text}`}>
                                    {colItems.length}
                                </span>
                            </div>

                            {/* Column Content */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {colItems.length === 0 ? (
                                    <div className="text-center py-12 text-white/20 text-xs border border-dashed border-white/5 rounded-xl">
                                        Sin piezas en &quot;{status}&quot;
                                    </div>
                                ) : (
                                    colItems.map(item => {
                                        const fmtSt = FMT_STYLES[item.fmt] || { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', dot: '#FFFFFF' };

                                        return (
                                            <div
                                                key={item.id}
                                                onClick={() => onOpenDay(item.date, item)}
                                                className="bg-[#1C1C1C] hover:bg-[#232323] border border-white/10 hover:border-white/25 rounded-xl p-3.5 transition-all cursor-pointer shadow-md group relative space-y-2.5"
                                            >
                                                {/* Header row: Format pill + date */}
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1.5 ${fmtSt.bg} ${fmtSt.border} ${fmtSt.text}`}>
                                                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: fmtSt.dot }} />
                                                        {item.fmt}
                                                    </span>
                                                    <span className="text-white/40 text-[11px] font-medium flex items-center gap-1">
                                                        <Calendar className="w-3 h-3 text-[#F7931E]" /> {item.date}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h4 className="text-white font-bold text-sm leading-snug line-clamp-2 group-hover:text-[#F7931E] transition-colors">
                                                    {item.rule && <span className="text-[#F7931E] mr-1">↻</span>}
                                                    {item.title || 'Contenido sin título'}
                                                </h4>

                                                {/* Metadata: Responsible, Hour, Platforms */}
                                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                                    {item.platforms && item.platforms.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            {item.platforms.slice(0, 3).map(p => {
                                                                const pSt = PLATFORM_PILLS[p];
                                                                return pSt ? (
                                                                    <span key={p} className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${pSt.bg} ${pSt.border} ${pSt.text}`}>
                                                                        {pSt.label}
                                                                    </span>
                                                                ) : null;
                                                            })}
                                                            {item.platforms.length > 3 && (
                                                                <span className="text-[9px] text-white/40 font-bold">+{item.platforms.length - 3}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                    {item.responsible && (
                                                        <span className="text-white/40 text-[10px] flex items-center gap-1 ml-auto">
                                                            <User className="w-2.5 h-2.5" /> {item.responsible}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Fast Status Mover dropdown (admin only) */}
                                                {mode === 'admin' && (
                                                    <div
                                                        className="pt-2 border-t border-white/5 flex items-center justify-between"
                                                        onClick={e => e.stopPropagation()}
                                                    >
                                                        <span className="text-[10px] text-white/30">Mover a:</span>
                                                        <select
                                                            value={item.status}
                                                            onChange={e => onUpdateStatus(item.id, e.target.value, item.rule)}
                                                            className="bg-[#141414] border border-white/10 text-white/80 text-[10px] font-semibold rounded-lg px-2 py-0.5 outline-none [color-scheme:dark] [&>option]:bg-[#1C1C1C] cursor-pointer hover:border-white/30"
                                                        >
                                                            {STATUSES.map(s => (
                                                                <option key={s} value={s}>{s}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
