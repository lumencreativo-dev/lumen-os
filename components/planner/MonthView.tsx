'use client';

import { useState } from 'react';
import {
    LayoutGrid, ChevronLeft, ChevronRight, Plus
} from 'lucide-react';
import {
    DndContext, DragOverlay, useDraggable, useDroppable,
    PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent, DragStartEvent
} from '@dnd-kit/core';
import { PlannerItem, PlannerMilestone } from './types';
import { MONTHS, FMTS, FMT_STYLES, pad, todayStr } from './constants';
import { DayDialog } from './DayDialog';

interface MonthViewProps {
    mode: 'admin' | 'client';
    year: number;
    mon: number;
    setMon: (m: number | null | ((prev: number | null) => number | null)) => void;
    allItems: PlannerItem[];
    milestoneOnFn: (date: string) => PlannerMilestone[];
    dlgDate: string | null;
    setDlgDate: (d: string | null) => void;
    fichaItem: PlannerItem | null;
    setFichaItem: (item: PlannerItem | null) => void;
    onAddItem: (date: string, freq?: string, initialData?: { title?: string; fmt?: string }) => void;
    onUpdateItem: (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => void;
    onDeleteItem: (id: string, isRule?: boolean) => void;
}

// ── Draggable Item Component ──────────────────────────────────────────────────
function DraggablePill({ item, onClick, isDragDisabled }: { item: PlannerItem; onClick: () => void; isDragDisabled: boolean }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.id,
        data: { item },
        disabled: isDragDisabled
    });

    const st = FMT_STYLES[item.fmt] || { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white', dot: '#FFFFFF' };

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={e => {
                e.stopPropagation();
                onClick();
            }}
            className={`text-xs rounded-lg px-2 py-1 mb-1 border font-semibold flex items-center gap-1.5 shadow-sm truncate transition-all cursor-grab active:cursor-grabbing ${
                isDragging ? 'opacity-30 scale-95' : 'hover:scale-[1.02]'
            } ${st.bg} ${st.border} ${st.text}`}
        >
            <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: st.dot }} />
            <span className="truncate">
                {item.rule ? '↻ ' : ''}{item.title || item.fmt}
            </span>
        </div>
    );
}

// ── Droppable Day Cell ────────────────────────────────────────────────────────
function DayCell({
    d,
    dateStr,
    isToday,
    isPast,
    isWeekend,
    dayItems,
    milestones,
    onOpenDay,
    isDragDisabled
}: {
    d: number;
    dateStr: string;
    isToday: boolean;
    isPast: boolean;
    isWeekend: boolean;
    dayItems: PlannerItem[];
    milestones: PlannerMilestone[];
    onOpenDay: () => void;
    isDragDisabled: boolean;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: dateStr,
        disabled: isDragDisabled
    });

    const hasItems = dayItems.length > 0;

    return (
        <div
            ref={setNodeRef}
            onClick={onOpenDay}
            className={`min-h-[110px] md:min-h-[135px] rounded-2xl p-2.5 text-left border transition-all cursor-pointer group flex flex-col justify-between ${
                isOver
                    ? 'border-[#F7931E] bg-[#F7931E]/20 ring-2 ring-[#F7931E]'
                    : isToday
                        ? 'border-[#F7931E] bg-[#F7931E]/15 ring-2 ring-[#F7931E]/30 shadow-lg shadow-[#F7931E]/10'
                        : hasItems
                            ? 'border-white/15 bg-[#181818] hover:border-white/30 hover:bg-[#202020]'
                            : isWeekend
                                ? 'border-white/5 bg-[#131313] hover:border-white/20 hover:bg-[#181818]'
                                : 'border-white/10 bg-[#151515] hover:border-white/25 hover:bg-[#1C1C1C]'
            }`}
        >
            <div className="w-full">
                {/* Day Number Header */}
                <div className="flex items-center justify-between mb-1.5">
                    <span
                        className={`text-base font-black transition-colors ${
                            isToday
                                ? 'text-[#F7931E]'
                                : isPast
                                    ? 'text-white/40 group-hover:text-white'
                                    : 'text-white group-hover:text-[#F7931E]'
                        }`}
                    >
                        {d}
                    </span>

                    {isToday && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#F7931E] text-black uppercase tracking-wider">
                            Hoy
                        </span>
                    )}

                    {!isToday && isWeekend && (
                        <span className="text-[9px] font-bold text-white/20 uppercase">
                            Finde
                        </span>
                    )}
                </div>

                {/* Milestones / Efemérides */}
                {milestones.map(ms => (
                    <div
                        key={ms.id}
                        className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-200 rounded-lg px-2 py-0.5 mb-1.5 font-bold flex items-center gap-1.5 shadow-sm truncate"
                    >
                        <span className="shrink-0">{ms.emoji || '⭐'}</span>
                        <span className="truncate">{ms.title}</span>
                    </div>
                ))}

                {/* Items in this Day */}
                {dayItems.slice(0, 3).map(it => (
                    <DraggablePill
                        key={it.id}
                        item={it}
                        onClick={onOpenDay}
                        isDragDisabled={isDragDisabled}
                    />
                ))}
            </div>

            {dayItems.length > 3 && (
                <div className="text-xs font-bold text-[#F7931E] mt-1 flex items-center justify-between">
                    <span>+{dayItems.length - 3} más</span>
                    <span className="text-[10px] text-white/30 group-hover:text-white/60">Ver todos →</span>
                </div>
            )}
        </div>
    );
}

// ── Main MonthView Component ──────────────────────────────────────────────────
export function MonthView({
    mode,
    year,
    mon,
    setMon,
    allItems,
    milestoneOnFn,
    dlgDate,
    setDlgDate,
    fichaItem,
    setFichaItem,
    onAddItem,
    onUpdateItem,
    onDeleteItem
}: MonthViewProps) {
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const firstDay = (new Date(year, mon, 1).getDay() + 6) % 7;
    const prefix = `${year}-${pad(mon + 1)}`;
    const monthItems = allItems.filter(i => i.date.startsWith(prefix));
    const td = todayStr();

    // DND Sensors (drag and drop)
    const [activeDragItem, setActiveDragItem] = useState<PlannerItem | null>(null);
    const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 6 } });
    const touchSensor = useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } });
    const sensors = useSensors(pointerSensor, touchSensor);

    const counts: Record<string, number> = {};
    FMTS.forEach(f => {
        counts[f.name] = monthItems.filter(i => i.fmt === f.name).length;
    });

    const handleDragStart = (e: DragStartEvent) => {
        const item = e.active.data.current?.item as PlannerItem;
        if (item) setActiveDragItem(item);
    };

    const handleDragEnd = (e: DragEndEvent) => {
        setActiveDragItem(null);
        const { active, over } = e;
        if (!over) return;
        const targetDate = String(over.id);
        const item = active.data.current?.item as PlannerItem;
        if (item && targetDate && targetDate !== item.date) {
            onUpdateItem(item.id, { date: targetDate }, item.rule);
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div>
                {/* Header: Month Navigator + Stats */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setMon(null)}
                            title="Volver a vista anual"
                            className="text-white/50 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 text-xs font-semibold"
                        >
                            <LayoutGrid className="w-4 h-4" />
                            <span className="hidden sm:inline">Año</span>
                        </button>

                        <button
                            onClick={() => setMon((m: number | null) => (typeof m === 'number' && m === 0 ? 11 : ((m ?? 0) - 1)))}
                            className="text-white/50 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>

                        <h2 className="font-black text-white text-lg sm:text-2xl px-1">
                            {MONTHS[mon]} <span className="text-[#F7931E]">{year}</span>
                        </h2>

                        <button
                            onClick={() => setMon((m: number | null) => (typeof m === 'number' && m === 11 ? 0 : ((m ?? 0) + 1)))}
                            className="text-white/50 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Stats pills */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                        {FMTS.map(f => (
                            <div key={f.name} className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-xl">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                                <span className="text-white/50 text-xs">{f.name}s: <strong className="text-white font-bold">{counts[f.name]}</strong></span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-2 mb-2">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((d, idx) => (
                        <div
                            key={d}
                            className={`text-center text-xs sm:text-sm font-bold uppercase tracking-wider py-1.5 ${
                                idx >= 5 ? 'text-white/40' : 'text-white/80'
                            }`}
                        >
                            <span className="hidden md:inline">{d}</span>
                            <span className="md:hidden">{d[0]}</span>
                        </div>
                    ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
                    {Array.from({ length: firstDay }, (_, i) => (
                        <div key={`empty-${i}`} className="min-h-[110px] md:min-h-[135px] opacity-20" />
                    ))}

                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const d = i + 1;
                        const dateStr = `${year}-${pad(mon + 1)}-${pad(d)}`;
                        const dayItems = monthItems.filter(it => it.date === dateStr);
                        const mss = milestoneOnFn(dateStr);
                        const isToday = dateStr === td;
                        const isPast = dateStr < td;
                        const dayOfWeek = (firstDay + i) % 7;
                        const isWeekend = dayOfWeek >= 5;

                        return (
                            <DayCell
                                key={d}
                                d={d}
                                dateStr={dateStr}
                                isToday={isToday}
                                isPast={isPast}
                                isWeekend={isWeekend}
                                dayItems={dayItems}
                                milestones={mss}
                                onOpenDay={() => setDlgDate(dateStr)}
                                isDragDisabled={mode === 'client'}
                            />
                        );
                    })}
                </div>

                {/* Drag Overlay Ghost */}
                <DragOverlay>
                    {activeDragItem ? (
                        <div className="text-xs rounded-lg px-2.5 py-1.5 bg-[#F7931E] text-black font-bold shadow-2xl ring-2 ring-white scale-105 pointer-events-none">
                            {activeDragItem.title || activeDragItem.fmt}
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Day Dialog */}
                {dlgDate && (
                    <DayDialog
                        mode={mode}
                        date={dlgDate}
                        items={monthItems.filter(i => i.date === dlgDate)}
                        milestones={milestoneOnFn(dlgDate)}
                        fichaItem={fichaItem}
                        setFichaItem={setFichaItem}
                        onClose={() => setDlgDate(null)}
                        onAdd={onAddItem}
                        onUpdate={onUpdateItem}
                        onDelete={onDeleteItem}
                    />
                )}
            </div>
        </DndContext>
    );
}
