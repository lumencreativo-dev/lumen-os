'use client';

import { useState, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Image as ImageIcon, Trash2,
    Zap, Clock, AlertTriangle, CheckSquare, Calendar,
    ArrowRight, Flame, TrendingUp, Plus, Settings2, Copy,
    Check, ExternalLink, ShieldCheck, Phone
} from 'lucide-react';
import { PlannerClient, PlannerItem, PlannerTask } from './types';
import { FMTS, MONTHS, STATUSES, STATUS_BADGE_STYLES, todayStr, pad } from './constants';
import { ConfirmModal } from './ConfirmModal';

interface HomeViewProps {
    clients: PlannerClient[];
    tasks: PlannerTask[];
    year: number;
    setYear: (y: number | ((prev: number) => number)) => void;
    buildItems: (clientId: string, forYear: number) => PlannerItem[];
    onOpenClient: (clientId: string, goToCurrentMonth?: boolean) => void;
    onUpdateClientAvatar?: (clientId: string, avatarUrl: string) => void;
    onUpdateClient?: (clientId: string, patch: Partial<PlannerClient>) => void;
    onDeleteClient?: (clientId: string) => void;
    onGoToQueue?: () => void;
    onAddClient?: (name?: string) => void;
    mode: 'admin' | 'client';
}

export function HomeView({
    clients,
    tasks,
    year,
    setYear,
    buildItems,
    onOpenClient,
    onUpdateClientAvatar,
    onUpdateClient,
    onDeleteClient,
    onGoToQueue,
    onAddClient,
    mode
}: HomeViewProps) {
    const td = todayStr();
    const d7 = new Date();
    d7.setDate(d7.getDate() + 7);
    const d7Str = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;
    const curMonth = new Date().getMonth();

    const [clientToDelete, setClientToDelete] = useState<PlannerClient | null>(null);
    const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
    const [avatarUrlInput, setAvatarUrlInput] = useState('');
    const [newClientName, setNewClientName] = useState('');

    // Settings modal state
    const [settingsClient, setSettingsClient] = useState<PlannerClient | null>(null);
    const [settingsMaxRevs, setSettingsMaxRevs] = useState<number>(2);
    const [settingsPhone, setSettingsPhone] = useState<string>('');
    const [settingsAvatar, setSettingsAvatar] = useState<string>('');
    const [copiedPortalId, setCopiedPortalId] = useState<string | null>(null);

    const openSettings = (c: PlannerClient) => {
        setSettingsClient(c);
        setSettingsMaxRevs(c.max_revisions ?? 2);
        setSettingsPhone(c.contact_phone || '');
        setSettingsAvatar(c.avatar || '');
    };

    const handleSaveSettings = () => {
        if (!settingsClient || !onUpdateClient) return;
        onUpdateClient(settingsClient.id, {
            max_revisions: Number(settingsMaxRevs) || 2,
            contact_phone: settingsPhone.trim(),
            avatar: settingsAvatar.trim()
        });
        setSettingsClient(null);
    };

    const handleCopyPortalLink = (clientId: string) => {
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        const url = `${origin}/planner/${clientId}`;
        navigator.clipboard.writeText(url);
        setCopiedPortalId(clientId);
        setTimeout(() => setCopiedPortalId(null), 2000);
    };

    const handleSaveAvatar = (clientId: string) => {
        if (onUpdateClientAvatar) {
            onUpdateClientAvatar(clientId, avatarUrlInput.trim());
        }
        setEditingAvatarId(null);
        setAvatarUrlInput('');
    };

    // Global KPI data
    const kpiData = useMemo(() => {
        const curY = new Date().getFullYear();
        let totalPieces = 0;
        let pendingTasks = 0;
        let overdueTasks = 0;
        let todayItems = 0;
        let next7Items = 0;
        const urgentItems: (PlannerItem & { clientName: string; clientColor: string })[] = [];

        for (const cl of clients) {
            const allNow = buildItems(cl.id, curY);
            const yearItems = allNow.filter(i => i.date.startsWith(String(curY)));
            totalPieces += yearItems.length;

            const clTasks = tasks.filter(t => t.client_id === cl.id && !t.done);
            pendingTasks += clTasks.length;
            overdueTasks += clTasks.filter(t => t.date && t.date < td).length;

            todayItems += allNow.filter(i => i.date === td).length;
            next7Items += allNow.filter(i => i.date > td && i.date <= d7Str).length;

            // Collect urgent items (next 7 days, not published)
            allNow
                .filter(i => i.date >= td && i.date <= d7Str && i.status !== 'Publicado')
                .forEach(i => {
                    urgentItems.push({
                        ...i,
                        clientName: cl.name,
                        clientColor: cl.color
                    });
                });
        }

        // Sort urgent items by date
        urgentItems.sort((a, b) => a.date.localeCompare(b.date));

        return { totalPieces, pendingTasks, overdueTasks, todayItems, next7Items, urgentItems: urgentItems.slice(0, 8) };
    }, [clients, tasks, buildItems, td, d7Str]);

    // Greeting based on time of day
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 19) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const todayFormatted = new Date().toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                        {getGreeting()} 👋
                    </h1>
                    <p className="text-white/40 text-sm mt-1 capitalize">{todayFormatted}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setYear(y => y - 1)}
                        className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-black text-white text-xl w-14 text-center tracking-tight">{year}</span>
                    <button
                        onClick={() => setYear(y => y + 1)}
                        className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Global KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                        <TrendingUp className="w-3.5 h-3.5" />
                        Total {year}
                    </div>
                    <span className="text-2xl font-black text-white">{kpiData.totalPieces}</span>
                    <span className="text-[11px] text-white/30 font-medium">piezas de contenido</span>
                </div>

                <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-[#F7931E]/70 text-xs font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        Hoy
                    </div>
                    <span className="text-2xl font-black text-[#F7931E]">{kpiData.todayItems}</span>
                    <span className="text-[11px] text-white/30 font-medium">piezas programadas</span>
                </div>

                <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-blue-400/70 text-xs font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        Próx. 7 días
                    </div>
                    <span className="text-2xl font-black text-blue-400">{kpiData.next7Items}</span>
                    <span className="text-[11px] text-white/30 font-medium">por publicar</span>
                </div>

                <div className="bg-[#141414] border border-white/8 rounded-2xl p-4 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-white/40 text-xs font-medium">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Tareas
                    </div>
                    <span className="text-2xl font-black text-white">{kpiData.pendingTasks}</span>
                    <span className="text-[11px] text-white/30 font-medium">pendientes</span>
                </div>

                <div className={`bg-[#141414] border rounded-2xl p-4 flex flex-col gap-1 col-span-2 lg:col-span-1 ${
                    kpiData.overdueTasks > 0 ? 'border-red-500/30' : 'border-white/8'
                }`}>
                    <div className={`flex items-center gap-2 text-xs font-medium ${
                        kpiData.overdueTasks > 0 ? 'text-red-400/70' : 'text-white/40'
                    }`}>
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Vencidas
                    </div>
                    <span className={`text-2xl font-black ${kpiData.overdueTasks > 0 ? 'text-red-400' : 'text-white/30'}`}>
                        {kpiData.overdueTasks}
                    </span>
                    <span className="text-[11px] text-white/30 font-medium">tareas atrasadas</span>
                </div>
            </div>

            {/* What's Next — Urgent Items */}
            {kpiData.urgentItems.length > 0 && (
                <div className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 pt-4 pb-3">
                        <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-[#F7931E]" />
                            <h3 className="text-white font-bold text-sm">Qué viene esta semana</h3>
                            <span className="text-white/30 text-xs font-medium">({kpiData.urgentItems.length} piezas)</span>
                        </div>
                        {onGoToQueue && (
                            <button
                                onClick={onGoToQueue}
                                className="flex items-center gap-1.5 text-[#F7931E] text-xs font-semibold hover:text-[#F7931E]/80 transition-all"
                            >
                                Ver cola completa <ArrowRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                    <div className="divide-y divide-white/5">
                        {kpiData.urgentItems.map(item => {
                            const fmt = FMTS.find(f => f.name === item.fmt);
                            const statusStyle = STATUS_BADGE_STYLES[item.status] || STATUS_BADGE_STYLES['Idea'];
                            const isToday = item.date === td;
                            const dayLabel = isToday ? 'Hoy' :
                                new Date(item.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-all cursor-pointer"
                                    onClick={() => onOpenClient(item.client_id, true)}
                                >
                                    {/* Date badge */}
                                    <div className={`shrink-0 w-16 text-center py-1 rounded-lg text-[11px] font-bold ${
                                        isToday
                                            ? 'bg-[#F7931E]/15 text-[#F7931E] border border-[#F7931E]/30'
                                            : 'bg-white/5 text-white/50 border border-white/5'
                                    }`}>
                                        {dayLabel}
                                    </div>

                                    {/* Client dot */}
                                    <div
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: item.clientColor }}
                                        title={item.clientName}
                                    />

                                    {/* Content info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white text-xs font-semibold truncate">
                                                {item.title || 'Sin título'}
                                            </span>
                                        </div>
                                        <span className="text-white/30 text-[11px]">{item.clientName}</span>
                                    </div>

                                    {/* Format pill */}
                                    {fmt && (
                                        <span
                                            className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md"
                                            style={{ backgroundColor: `${fmt.color}20`, color: fmt.color }}
                                        >
                                            {fmt.name}
                                        </span>
                                    )}

                                    {/* Status badge */}
                                    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md ${statusStyle}`}>
                                        {item.status}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Client Cards Grid */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-bold text-sm">
                        Clientes <span className="text-white/30 font-medium">({clients.length})</span>
                    </h3>
                    {mode === 'admin' && onAddClient && (
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                if (newClientName.trim()) {
                                    onAddClient(newClientName.trim());
                                    setNewClientName('');
                                }
                            }}
                            className="flex items-center gap-2"
                        >
                            <input
                                value={newClientName}
                                onChange={e => setNewClientName(e.target.value)}
                                placeholder="Nuevo cliente..."
                                className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/60 w-32 lg:w-40"
                            />
                            <button
                                type="submit"
                                className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md shadow-[#F7931E]/20 transition-all"
                            >
                                <Plus className="w-3 h-3" /> Añadir
                            </button>
                        </form>
                    )}
                </div>

                {clients.length === 0 ? (
                    <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
                        <p className="text-base font-semibold">No hay clientes creados todavía.</p>
                        <p className="text-xs text-white/20 mt-1">Usa el formulario de arriba para añadir el primer cliente.</p>
                    </div>
                ) : (
                    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                        {clients.map(c => {
                            const allItems = buildItems(c.id, year);
                            const yearItems = allItems.filter(i => i.date.startsWith(String(year)));
                            const counts: Record<string, number> = {};
                            FMTS.forEach(f => {
                                counts[f.name] = yearItems.filter(i => i.fmt === f.name).length;
                            });
                            const total = Object.values(counts).reduce((a, b) => a + b, 0);

                            const clientTasks = tasks.filter(t => t.client_id === c.id && !t.done);
                            const lateTasks = clientTasks.filter(t => t.date && t.date < td);

                            // Agenda: all recurring items for current year
                            const allNow = buildItems(c.id, new Date().getFullYear());
                            const todayN = allNow.filter(i => i.date === td).length;
                            const next7N = allNow.filter(i => i.date > td && i.date <= d7Str).length;

                            return (
                                <div
                                    key={c.id}
                                    className="bg-[#141414] border border-white/8 rounded-2xl overflow-hidden hover:border-white/20 transition-all group relative"
                                >
                                    {/* Color accent top bar */}
                                    <div className="h-1" style={{ backgroundColor: c.color }} />

                                    <div className="p-5 flex flex-col gap-3.5">
                                        {/* Header */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0 overflow-hidden relative shadow-md"
                                                style={{ backgroundColor: c.color }}
                                            >
                                                {c.avatar ? (
                                                    <img src={c.avatar} alt={c.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    c.name.trim()[0]?.toUpperCase() ?? '?'
                                                )}

                                                {mode === 'admin' && (
                                                    <button
                                                        onClick={e => {
                                                            e.stopPropagation();
                                                            setEditingAvatarId(c.id);
                                                            setAvatarUrlInput(c.avatar || '');
                                                        }}
                                                        title="Cambiar avatar o logo"
                                                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs transition-opacity"
                                                    >
                                                        <ImageIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-white text-base truncate group-hover:text-[#F7931E] transition-colors">
                                                    {c.name}
                                                </h3>
                                                <span className="text-white/40 text-xs font-semibold">
                                                    {total} contenidos en {year}
                                                </span>
                                            </div>

                                            {mode === 'admin' && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => openSettings(c)}
                                                        title="Configuración y Portal del Cliente"
                                                        className="text-white/40 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all"
                                                    >
                                                        <Settings2 className="w-4 h-4" />
                                                    </button>
                                                    {onDeleteClient && (
                                                        <button
                                                            onClick={() => setClientToDelete(c)}
                                                            title="Eliminar cliente"
                                                            className="text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Avatar edit input inline */}
                                        {editingAvatarId === c.id && (
                                            <div className="p-2 bg-[#1C1C1C] rounded-xl border border-white/10 space-y-2">
                                                <p className="text-[11px] text-white/50 font-medium">URL de logo/avatar:</p>
                                                <div className="flex gap-2">
                                                    <input
                                                        value={avatarUrlInput}
                                                        onChange={e => setAvatarUrlInput(e.target.value)}
                                                        placeholder="https://...imagen.png"
                                                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none focus:border-[#F7931E]"
                                                    />
                                                    <button
                                                        onClick={() => handleSaveAvatar(c.id)}
                                                        className="bg-[#F7931E] text-white text-xs font-bold px-3 py-1 rounded-lg"
                                                    >
                                                        OK
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingAvatarId(null)}
                                                        className="text-white/40 hover:text-white text-xs px-2"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Format breakdown compact */}
                                        <div className="flex flex-wrap gap-1.5">
                                            {FMTS.map(f => (
                                                <div key={f.name} className="flex items-center gap-1.5 bg-white/4 rounded-lg px-2 py-1">
                                                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                                    <span className="text-white/50 text-[10px]">{f.name === 'Historia' ? 'Hist.' : f.name}</span>
                                                    <span className="text-white font-bold text-[10px]">{counts[f.name]}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Quick stats row */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2 text-xs">
                                                <span className="text-white/40">Tareas</span>
                                                <span className="text-white/70 font-medium">
                                                    {clientTasks.length === 0
                                                        ? '✓'
                                                        : <>{clientTasks.length}{lateTasks.length > 0 && <span className="text-red-400 font-bold ml-1">({lateTasks.length} ⚠)</span>}</>
                                                    }
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between bg-white/3 rounded-xl px-3 py-2 text-xs">
                                                <span className="text-white/40">Agenda</span>
                                                <span className="text-white/70 font-medium">
                                                    {todayN > 0 && <span className="text-[#F7931E] font-bold">{todayN} hoy</span>}
                                                    {todayN > 0 && next7N > 0 && ' · '}
                                                    {next7N > 0 && <span>{next7N} prox</span>}
                                                    {todayN === 0 && next7N === 0 && '—'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 pt-1">
                                            <button
                                                onClick={() => onOpenClient(c.id, false)}
                                                className="flex-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-90 shadow-md flex items-center justify-center gap-1.5"
                                                style={{ backgroundColor: c.color }}
                                            >
                                                <Calendar className="w-3.5 h-3.5" />
                                                Calendario {year}
                                            </button>
                                            <button
                                                onClick={() => onOpenClient(c.id, true)}
                                                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5"
                                            >
                                                <ArrowRight className="w-3.5 h-3.5" />
                                                Ir a {MONTHS[curMonth].toLowerCase()}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Custom Confirm Modal for Client Deletion */}
            <ConfirmModal
                isOpen={!!clientToDelete}
                title={`Eliminar cliente "${clientToDelete?.name}"`}
                message={`¿Estás seguro de que deseas eliminar permanentemente al cliente "${clientToDelete?.name}" y todo su calendario, reglas, tareas e hitos? Esta acción no se puede deshacer.`}
                confirmLabel="Eliminar cliente"
                onConfirm={() => {
                    if (clientToDelete && onDeleteClient) {
                        onDeleteClient(clientToDelete.id);
                        setClientToDelete(null);
                    }
                }}
                onCancel={() => setClientToDelete(null)}
            />

            {/* Client Settings & Portal Modal */}
            {settingsClient && (
                <div
                    className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    onClick={() => setSettingsClient(null)}
                >
                    <div
                        onClick={e => e.stopPropagation()}
                        className="bg-[#161616] border border-white/15 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5"
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-black shrink-0 overflow-hidden"
                                    style={{ backgroundColor: settingsClient.color }}
                                >
                                    {settingsAvatar ? (
                                        <img src={settingsAvatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        settingsClient.name[0]?.toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-base">Configuración de {settingsClient.name}</h3>
                                    <p className="text-white/40 text-xs">Ajustes del cliente y portal de aprobaciones</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSettingsClient(null)}
                                className="text-white/40 hover:text-white p-1 rounded-lg"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Portal share link */}
                        <div className="p-3 bg-white/5 border border-white/10 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white/70 flex items-center gap-1.5">
                                    <ShieldCheck className="w-3.5 h-3.5 text-[#F7931E]" /> Enlace al Portal del Cliente
                                </span>
                                <a
                                    href={`/planner/${settingsClient.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#F7931E] hover:underline flex items-center gap-1 text-[11px]"
                                >
                                    Abrir portal <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    readOnly
                                    value={typeof window !== 'undefined' ? `${window.location.origin}/planner/${settingsClient.id}` : `/planner/${settingsClient.id}`}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-[11px] text-white/70 font-mono outline-none"
                                />
                                <button
                                    onClick={() => handleCopyPortalLink(settingsClient.id)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                                        copiedPortalId === settingsClient.id
                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                            : 'bg-[#F7931E] text-white hover:bg-[#F7931E]/90'
                                    }`}
                                >
                                    {copiedPortalId === settingsClient.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedPortalId === settingsClient.id ? 'Copiado' : 'Copiar'}</span>
                                </button>
                            </div>
                        </div>

                        {/* Max revisions setting */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center justify-between">
                                <span>Rondas de ajustes incluidas por contenido:</span>
                                <span className="text-[#F7931E] font-black">{settingsMaxRevs} ronda{settingsMaxRevs !== 1 ? 's' : ''}</span>
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={settingsMaxRevs}
                                onChange={e => setSettingsMaxRevs(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]"
                            />
                            <p className="text-[11px] text-white/40">
                                Al alcanzar este número de ajustes solicitados, el botón del portal se bloqueará.
                            </p>
                        </div>

                        {/* Phone / WhatsApp */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-[#F7931E]" /> WhatsApp de soporte para el cliente:
                            </label>
                            <input
                                value={settingsPhone}
                                onChange={e => setSettingsPhone(e.target.value)}
                                placeholder="+58 412 1234567"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E] placeholder-white/20"
                            />
                        </div>

                        {/* Avatar URL */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-white/80 flex items-center gap-1.5">
                                <ImageIcon className="w-3.5 h-3.5 text-[#F7931E]" /> Logo / Avatar URL:
                            </label>
                            <input
                                value={settingsAvatar}
                                onChange={e => setSettingsAvatar(e.target.value)}
                                placeholder="https://...imagen.png"
                                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E] placeholder-white/20"
                            />
                        </div>

                        {/* Save & Cancel */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">
                            <button
                                onClick={() => setSettingsClient(null)}
                                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-semibold"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                className="px-5 py-2 rounded-xl bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold shadow-lg shadow-[#F7931E]/20"
                            >
                                Guardar configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
