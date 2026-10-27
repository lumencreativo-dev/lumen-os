'use client';

import { useState } from 'react';
import {
    Calendar, Clock, User, ExternalLink, ArrowRight, CheckCircle2, GripVertical
} from 'lucide-react';
import {
    DndContext, DragOverlay, useDraggable, useDroppable,
    PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragStartEvent
} from '@dnd-kit/core';
import { PlannerItem } from './types';
import {
    STATUSES, STATUS_COLORS, STATUS_BADGE_STYLES, FMT_STYLES, PLATFORM_PILLS
} from './constants';

interface KanbanViewProps {
    items: PlannerItem[];
    mode: 'admin' | 'client';
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
    onOpenCard: (item: PlannerItem) => void;
}

// ── Draggable Kanban Card Component ───────────────────────────────────────────
function DraggableKanbanCard({
    item,
    mode,
    onOpen,
    onUpdateStatus
}: {
    item: PlannerItem;
    mode: 'admin' | 'client';
    onOpen: () => void;
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { item },
        disabled: mode === 'client'
    });

    const fmtSt = FMT_STYLES[item.fmt] || { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', dot: '#FFFFFF' };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={e => {
                e.stopPropagation();
                onOpen();
            }}
            className={`bg-[#1C1C1C] hover:bg-[#232323] border border-white/10 hover:border-white/30 rounded-xl p-3.5 transition-all shadow-md group relative space-y-2.5 ${
                mode === 'admin' ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'
            } ${isDragging ? 'opacity-30 scale-95 ring-2 ring-[#F7931E]' : 'hover:scale-[1.01]'}`}
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

            {/* Metadata: Platforms & Responsible */}
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
                    <span className="text-[10px] text-white/30 flex items-center gap-1">
                        <GripVertical className="w-3 h-3 text-white/20" /> Mover:
                    </span>
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
}

// ── Droppable Kanban Column Component ─────────────────────────────────────────
function DroppableKanbanColumn({
    status,
    items,
    mode,
    onOpenCard,
    onUpdateStatus
}: {
    status: string;
    items: PlannerItem[];
    mode: 'admin' | 'client';
    onOpenCard: (item: PlannerItem) => void;
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: status,
        disabled: mode === 'client'
    });

    const colColor = STATUS_COLORS[status] || '#9E9E9E';
    const badgeSt = STATUS_BADGE_STYLES[status] || { bg: 'bg-zinc-800', text: 'text-zinc-300', border: 'border-zinc-700' };

    return (
        <div
            ref={setNodeRef}
            className={`min-w-[280px] max-w-[320px] flex-1 rounded-2xl flex flex-col h-[75vh] transition-all border ${
                isOver
                    ? 'border-[#F7931E] bg-[#F7931E]/10 ring-2 ring-[#F7931E]/40'
                    : 'border-white/5 bg-[#141414]'
            }`}
        >
            {/* Column Header */}
            <div className="p-3.5 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colColor }} />
                    <h3 className="font-bold text-white text-sm tracking-wide">{status}</h3>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badgeSt.bg} ${badgeSt.border} ${badgeSt.text}`}>
                    {items.length}
                </span>
            </div>

            {/* Column Cards */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                {items.length === 0 ? (
                    <div className="text-center py-12 text-white/20 text-xs border border-dashed border-white/5 rounded-xl">
                        Arrastra piezas a &quot;{status}&quot;
                    </div>
                ) : (
                    items.map(item => (
                        <DraggableKanbanCard
                            key={item.id}
                            item={item}
                            mode={mode}
                            onOpen={() => onOpenCard(item)}
                            onUpdateStatus={onUpdateStatus}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

// ── Main Kanban View with DND Context ─────────────────────────────────────────
export function KanbanView({ items, mode, onUpdateStatus, onOpenCard }: KanbanViewProps) {
    const [selectedFmt, setSelectedFmt] = useState<string>('all');
    const [activeDragItem, setActiveDragItem] = useState<PlannerItem | null>(null);

    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } });
    const sensors = useSensors(pointerSensor, touchSensor);

    const filteredItems = selectedFmt === 'all'
        ? items
        : items.filter(it => it.fmt === selectedFmt);

    const handleDragStart = (e: DragStartEvent) => {
        const item = e.active.data.current?.item as PlannerItem;
        if (item) setActiveDragItem(item);
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = e;
        if (!over) return;
        const targetStatus = String(over.id);
        const item = active.data.current?.item as PlannerItem;
        if (item && targetStatus && targetStatus !== item.status) {
            onUpdateStatus(item.id, targetStatus, item.rule);
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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

                    <span className="text-white/30 text-xs hidden sm:inline">
                        💡 Puedes arrastrar las tarjetas entre columnas
                    </span>
                </div>

                {/* Kanban Columns */}
                <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-thin">
                    {STATUSES.map(status => {
                        const colItems = filteredItems.filter(i => i.status === status);
                        return (
                            <DroppableKanbanColumn
                                key={status}
                                status={status}
                                items={colItems}
                                mode={mode}
                                onOpenCard={onOpenCard}
                                onUpdateStatus={onUpdateStatus}
                            />
                        );
                    })}
                </div>

                {/* Drag Overlay Ghost */}
                <DragOverlay>
                    {activeDragItem ? (
                        <div className="w-72 bg-[#222222] border-2 border-[#F7931E] rounded-xl p-3.5 shadow-2xl scale-105 pointer-events-none space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#F7931E] text-black">
                                    {activeDragItem.fmt}
                                </span>
                                <span className="text-white/60 text-xs">{activeDragItem.date}</span>
                            </div>
                            <p className="text-white font-bold text-sm leading-snug truncate">
                                {activeDragItem.title || 'Contenido sin título'}
                            </p>
                        </div>
                    ) : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
}
