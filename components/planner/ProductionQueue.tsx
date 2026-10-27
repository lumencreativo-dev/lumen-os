'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ListOrdered, ChevronDown, Filter, EyeOff, Eye,
    Clock, AlertTriangle, Flame, Zap, CalendarClock
} from 'lucide-react';

import { PlannerItem, PlannerClient } from './types';
import { FMTS, STATUSES, STATUS_BADGE_STYLES, FMT_STYLES, todayStr, pad } from './constants';

// ─── Urgency helpers ────────────────────────────────────────────────────────
type UrgencyLevel = 'past' | 'today' | 'soon' | 'week' | 'future';

function getUrgency(dateStr: string, today: string): UrgencyLevel {
    if (dateStr < today) return 'past';
    if (dateStr === today) return 'today';
    const diff = Math.round(
        (new Date(dateStr).getTime() - new Date(today).getTime()) / 864e5
    );
    if (diff <= 2) return 'soon';
    if (diff <= 7) return 'week';
    return 'future';
}

const URGENCY_CONFIG: Record<UrgencyLevel, {
    label: string; dotColor: string; textColor: string;
    badgeBg: string; badgeBorder: string; Icon: React.ElementType;
}> = {
    past:   { label: 'Vencido',   dotColor: '#EF4444', textColor: 'text-red-400',    badgeBg: 'bg-red-950/60',    badgeBorder: 'border-red-500/40',    Icon: AlertTriangle },
    today:  { label: 'Hoy',       dotColor: '#F7931E', textColor: 'text-orange-400', badgeBg: 'bg-orange-950/60', badgeBorder: 'border-orange-500/40', Icon: Flame },
    soon:   { label: 'Próximo',   dotColor: '#EAB308', textColor: 'text-yellow-400', badgeBg: 'bg-yellow-950/60', badgeBorder: 'border-yellow-500/40', Icon: Zap },
    week:   { label: 'Esta sem.', dotColor: '#60A5FA', textColor: 'text-blue-400',   badgeBg: 'bg-blue-950/60',   badgeBorder: 'border-blue-500/40',   Icon: CalendarClock },
    future: { label: 'Futuro',    dotColor: '#6B7280', textColor: 'text-zinc-400',   badgeBg: 'bg-zinc-900/60',   badgeBorder: 'border-zinc-600/40',   Icon: Clock },
};

// ─── Date group label ────────────────────────────────────────────────────────
const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
function groupLabel(dateStr: string, today: string): string {
    if (dateStr === today) return '📅 Hoy';
    const diff = Math.round(
        (new Date(dateStr).getTime() - new Date(today).getTime()) / 864e5
    );
    if (diff === 1) return '📅 Mañana';
    if (diff === -1) return '📅 Ayer';
    if (diff < 0) return `⚠️ Vencido ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`;
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${d} ${MONTHS_SHORT[m - 1]}${y !== new Date().getFullYear() ? ' ' + y : ''}`;
}

// ─── Date range helpers ──────────────────────────────────────────────────────
function addDays(dateStr: string, days: number): string {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Filter select component ─────────────────────────────────────────────────
function FilterSelect({
    value, onChange, options, allLabel
}: {
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    allLabel: string;
}) {
    return (
        <div className="relative">
            <select
                value={value}
                onChange={e => onChange(e.target.value)}
                className="appearance-none bg-[#1A1A1A] border border-white/10 rounded-xl text-xs text-white/80 pl-3 pr-8 py-1.5 outline-none focus:border-[#F7931E]/50 cursor-pointer transition-all hover:border-white/20"
            >
                <option value="">{allLabel}</option>
                {options.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-white/40" />
        </div>
    );
}

// ─── Inline Status Changer ───────────────────────────────────────────────────
function InlineStatusSelect({
    item, onUpdateStatus
}: {
    item: PlannerItem;
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
}) {
    const styles = STATUS_BADGE_STYLES[item.status] ?? STATUS_BADGE_STYLES['Idea'];
    return (
        <div className="relative shrink-0">
            <select
                value={item.status}
                onChange={e => {
                    e.stopPropagation();
                    onUpdateStatus(item.id, e.target.value, item.rule);
                }}
                onClick={e => e.stopPropagation()}
                className={`appearance-none border rounded-lg text-[10px] font-semibold pl-2.5 pr-6 py-1 outline-none cursor-pointer transition-all ${styles.bg} ${styles.text} ${styles.border}`}
            >
                {STATUSES.map(s => (
                    <option key={s} value={s} className="bg-[#1A1A1A] text-white">{s}</option>
                ))}
            </select>
            <ChevronDown className={`pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 ${styles.text}`} />
        </div>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
interface ProductionQueueProps {
    allClientsItems: PlannerItem[];
    clients: PlannerClient[];
    mode: 'admin' | 'client';
    fixedClientId?: string | null;
    onUpdateStatus: (id: string, status: string, isRule?: boolean) => void;
    onOpenCard: (item: PlannerItem) => void;
}

export function ProductionQueue({
    allClientsItems,
    clients,
    mode,
    fixedClientId,
    onUpdateStatus,
    onOpenCard,
}: ProductionQueueProps) {
    const today = todayStr();

    // Filter state
    const [filterClient, setFilterClient] = useState(fixedClientId ?? '');
    const [filterFmt, setFilterFmt] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterRange, setFilterRange] = useState('90'); // days from today. '' = no limit
    const [hidePast, setHidePast] = useState(false);
    const [hidePublished, setHidePublished] = useState(true); // Oculto por defecto
    const [onlyCreative, setOnlyCreative] = useState(false);

    // Date range limit
    const maxDate = filterRange ? addDays(today, Number(filterRange)) : null;
    // Past start: show up to 30 days ago
    const minDate = hidePast ? today : addDays(today, -30);

    const CREATIVE_STATUSES = ['Idea', 'En diseno', 'Corregir', 'Por aprobar'];

    const filtered = useMemo(() => {
        return allClientsItems
            .filter(item => {
                if (filterClient && item.client_id !== filterClient) return false;
                if (filterFmt && item.fmt !== filterFmt) return false;
                if (filterStatus && item.status !== filterStatus) return false;
                if (onlyCreative && !CREATIVE_STATUSES.includes(item.status)) return false;
                if (hidePublished && item.status === 'Publicado') return false;
                if (item.date < minDate) return false;
                if (maxDate && item.date > maxDate) return false;
                return true;
            })
            .sort((a, b) => a.date.localeCompare(b.date));
    }, [allClientsItems, filterClient, filterFmt, filterStatus, onlyCreative, hidePublished, minDate, maxDate]);

    // Group by date
    const grouped = useMemo(() => {
        const map = new Map<string, PlannerItem[]>();
        for (const item of filtered) {
            if (!map.has(item.date)) map.set(item.date, []);
            map.get(item.date)!.push(item);
        }
        return [...map.entries()]; // [ [dateStr, items[]], ... ]
    }, [filtered]);

    const clientOptions = clients.map(c => ({ value: c.id, label: c.name }));
    const fmtOptions = FMTS.map(f => ({ value: f.name, label: f.name }));
    const statusOptions = STATUSES.map(s => ({ value: s, label: s }));
    const rangeOptions = [
        { value: '7',   label: 'Próx. 7 días' },
        { value: '15',  label: 'Próx. 15 días' },
        { value: '30',  label: 'Próx. 30 días' },
        { value: '90',  label: 'Próx. 3 meses' },
        { value: '365', label: 'Próx. año' },
        { value: '',    label: 'Sin límite' },
    ];

    return (
        <div className="w-full">
            {/* ── Header ── */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-xl bg-[#F7931E]/15 border border-[#F7931E]/30 flex items-center justify-center shrink-0">
                    <ListOrdered className="w-4.5 h-4.5 text-[#F7931E]" />
                </div>
                <div>
                    <h2 className="text-white font-black text-lg leading-tight">Cola de Producción</h2>
                    <p className="text-white/40 text-xs">
                        {filtered.length} pieza{filtered.length !== 1 ? 's' : ''} · ordenadas por fecha de publicación
                    </p>
                </div>
            </div>

            {/* ── Filter Bar ── */}
            <div className="flex flex-wrap items-center gap-2 mb-6 p-3 bg-[#141414] border border-white/5 rounded-2xl">
                <Filter className="w-3.5 h-3.5 text-white/30 shrink-0" />

                {/* Client filter (admin only) */}
                {mode === 'admin' && (
                    <FilterSelect
                        value={filterClient}
                        onChange={setFilterClient}
                        options={clientOptions}
                        allLabel="Todos los clientes"
                    />
                )}

                <FilterSelect
                    value={filterFmt}
                    onChange={setFilterFmt}
                    options={fmtOptions}
                    allLabel="Todos los formatos"
                />

                <FilterSelect
                    value={filterStatus}
                    onChange={setFilterStatus}
                    options={statusOptions}
                    allLabel="Todos los estados"
                />

                <FilterSelect
                    value={filterRange}
                    onChange={setFilterRange}
                    options={rangeOptions}
                    allLabel="Sin límite"
                />

                {/* Toggles */}
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                    <button
                        onClick={() => setOnlyCreative(v => !v)}
                        title="Filtrar solo lo que está en producción activa (Idea, Diseño, Corregir, Por aprobar)"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                            onlyCreative
                                ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        }`}
                    >
                        <Zap className="w-3 h-3" />
                        <span>Solo en producción</span>
                    </button>
                    <button
                        onClick={() => setHidePast(v => !v)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                            hidePast
                                ? 'bg-[#F7931E]/15 border-[#F7931E]/40 text-[#F7931E]'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        }`}
                    >
                        {hidePast ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span className="hidden sm:inline">Sin pasados</span>
                    </button>
                    <button
                        onClick={() => setHidePublished(v => !v)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[10px] font-semibold transition-all ${
                            hidePublished
                                ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                                : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                        }`}
                    >
                        {hidePublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span className="hidden sm:inline">{hidePublished ? 'Publicados ocultos' : 'Ver publicados'}</span>
                    </button>
                </div>
            </div>

            {/* ── Empty State ── */}
            {grouped.length === 0 && (
                <div className="text-center py-20 text-white/25">
                    <ListOrdered className="w-10 h-10 mx-auto mb-3 text-[#F7931E]/30" />
                    <p className="font-bold text-white/40">No hay contenido en este rango</p>
                    <p className="text-xs mt-1">Prueba cambiar los filtros o ampliar el rango de fechas.</p>
                </div>
            )}

            {/* ── Date Groups ── */}
            <div className="space-y-6">
                <AnimatePresence>
                    {grouped.map(([date, dateItems]) => {
                        const urgency = getUrgency(date, today);
                        const uCfg = URGENCY_CONFIG[urgency];
                        const UIcon = uCfg.Icon;
                        const isPast = urgency === 'past';

                        return (
                            <motion.div
                                key={date}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.18 }}
                            >
                                {/* Date header */}
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: uCfg.dotColor }}
                                    />
                                    <span className={`text-xs font-black tracking-wide ${uCfg.textColor}`}>
                                        {groupLabel(date, today).toUpperCase()}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${uCfg.badgeBg} ${uCfg.badgeBorder} ${uCfg.textColor}`}>
                                        <UIcon className="w-2.5 h-2.5" />
                                        {uCfg.label}
                                    </span>
                                    <div className="flex-1 h-px bg-white/5" />
                                    <span className="text-white/20 text-[10px]">{dateItems.length} pieza{dateItems.length !== 1 ? 's' : ''}</span>
                                </div>

                                {/* Cards for this date */}
                                <div className="space-y-2 pl-4">
                                    <AnimatePresence mode="popLayout">
                                        {dateItems.map(item => {
                                            const fmtStyle = FMT_STYLES[item.fmt] ?? FMT_STYLES['Post'];
                                            const client = clients.find(c => c.id === item.client_id);

                                            return (
                                                <motion.div
                                                    key={item.id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.98 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                                                    onClick={() => onOpenCard(item)}
                                                    className={`group relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:border-white/20 hover:bg-white/[0.03] ${
                                                        isPast ? 'opacity-60' : ''
                                                    } bg-[#141414] border-white/8`}
                                                >
                                                {/* Format dot + badge */}
                                                <div className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-[10px] font-black ${fmtStyle.bg} ${fmtStyle.border} ${fmtStyle.text}`}>
                                                    {item.fmt.slice(0, 2).toUpperCase()}
                                                </div>

                                                {/* Main info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-white text-sm font-semibold truncate max-w-[280px]">
                                                            {item.title || <span className="text-white/30 italic">Sin título</span>}
                                                        </span>
                                                        {item.rule && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-900/40 border border-amber-500/30 text-amber-300 font-semibold shrink-0">
                                                                ↻ Recurrente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                        {/* Client pill (admin only) */}
                                                        {mode === 'admin' && client && (
                                                            <span
                                                                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white/90"
                                                                style={{ backgroundColor: client.color + '33', border: `1px solid ${client.color}55` }}
                                                            >
                                                                {client.name}
                                                            </span>
                                                        )}
                                                        {/* Format label */}
                                                        <span className={`text-[10px] font-semibold ${fmtStyle.text}`}>
                                                            {item.fmt}
                                                        </span>
                                                        {/* Platforms */}
                                                        {item.platforms && item.platforms.length > 0 && (
                                                            <span className="text-[10px] text-white/30">
                                                                · {item.platforms.join(', ')}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Right side: status + days badge */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {/* Days countdown */}
                                                    {urgency !== 'future' && (
                                                        <span className={`text-[10px] font-bold ${uCfg.textColor} hidden sm:inline`}>
                                                            {urgency === 'past' && `Hace ${Math.abs(Math.round((new Date(date).getTime() - new Date(today).getTime()) / 864e5))}d`}
                                                            {urgency === 'today' && '¡HOY!'}
                                                            {(urgency === 'soon' || urgency === 'week') && `En ${Math.round((new Date(date).getTime() - new Date(today).getTime()) / 864e5)}d`}
                                                        </span>
                                                    )}

                                                    {/* Inline status changer */}
                                                    <InlineStatusSelect item={item} onUpdateStatus={onUpdateStatus} />
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
