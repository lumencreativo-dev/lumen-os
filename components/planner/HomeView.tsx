'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Trash2 } from 'lucide-react';
import { PlannerClient, PlannerItem, PlannerTask } from './types';
import { FMTS, MONTHS, todayStr } from './constants';
import { ConfirmModal } from './ConfirmModal';

interface HomeViewProps {
    clients: PlannerClient[];
    tasks: PlannerTask[];
    year: number;
    setYear: (y: number | ((prev: number) => number)) => void;
    buildItems: (clientId: string, forYear: number) => PlannerItem[];
    onOpenClient: (clientId: string, goToCurrentMonth?: boolean) => void;
    onUpdateClientAvatar?: (clientId: string, avatarUrl: string) => void;
    onDeleteClient?: (clientId: string) => void;
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
    onDeleteClient,
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

    const handleSaveAvatar = (clientId: string) => {
        if (onUpdateClientAvatar) {
            onUpdateClientAvatar(clientId, avatarUrlInput.trim());
        }
        setEditingAvatarId(null);
        setAvatarUrlInput('');
    };

    return (
        <div>
            {/* Year Selector & Overview Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setYear(y => y - 1)}
                        className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-black text-white text-3xl w-20 text-center tracking-tight">{year}</span>
                    <button
                        onClick={() => setYear(y => y + 1)}
                        className="text-white/40 hover:text-white p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <span className="text-white/40 text-sm font-medium">
                    {clients.length} cliente{clients.length !== 1 ? 's' : ''} registrados · Selecciona uno para abrir su calendario
                </span>
            </div>

            {clients.length === 0 ? (
                <div className="text-center py-20 text-white/30 border border-dashed border-white/10 rounded-2xl">
                    <p className="text-base font-semibold">No hay clientes creados todavía.</p>
                    <p className="text-xs text-white/20 mt-1">Usa la barra superior para añadir el primer cliente.</p>
                </div>
            ) : (
                <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
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
                                className="bg-[#141414] border border-white/10 rounded-2xl p-5 hover:border-white/25 hover:bg-[#181818] transition-all flex flex-col justify-between gap-4 shadow-lg group relative"
                            >
                                {/* Header */}
                                <div>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0 overflow-hidden relative shadow-md"
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

                                        {mode === 'admin' && onDeleteClient && (
                                            <button
                                                onClick={() => setClientToDelete(c)}
                                                title="Eliminar cliente"
                                                className="text-white/20 hover:text-red-400 p-1.5 rounded-lg hover:bg-white/5 transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>

                                    {/* Avatar edit input inline */}
                                    {editingAvatarId === c.id && (
                                        <div className="mt-3 p-2 bg-[#1C1C1C] rounded-xl border border-white/10 space-y-2">
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

                                    {/* Format breakdown */}
                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-white/4 border border-white/5 rounded-xl p-3 mt-4">
                                        {FMTS.map(f => (
                                            <div key={f.name} className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                                <span className="text-white/50 text-xs flex-1">{f.name === 'Historia' ? 'Historias' : f.name + 's'}</span>
                                                <span className="text-white font-bold text-xs">{counts[f.name]}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Tasks row */}
                                    <div className="flex justify-between items-center bg-white/3 rounded-xl px-3 py-2 text-xs mt-2.5">
                                        <span className="text-white/40">Tareas</span>
                                        <span className="text-white/70 font-medium">
                                            {clientTasks.length === 0
                                                ? 'Sin pendientes'
                                                : <>{clientTasks.length} pendiente{clientTasks.length !== 1 ? 's' : ''}{lateTasks.length > 0 && <> · <span className="text-red-400 font-bold">{lateTasks.length} vencidas</span></>}</>
                                            }
                                        </span>
                                    </div>

                                    {/* Agenda row */}
                                    <div className="flex justify-between items-center bg-white/3 rounded-xl px-3 py-2 text-xs mt-2">
                                        <span className="text-white/40">Agenda</span>
                                        <span className="text-white/70 font-medium">Hoy: {todayN} · Próx. 7 días: {next7N}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-white/5">
                                    <button
                                        onClick={() => onOpenClient(c.id, false)}
                                        className="flex-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-90 shadow-md"
                                        style={{ backgroundColor: c.color }}
                                    >
                                        Abrir calendario {year}
                                    </button>
                                    <button
                                        onClick={() => onOpenClient(c.id, true)}
                                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
                                    >
                                        Ir a {MONTHS[curMonth].toLowerCase()}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

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
        </div>
    );
}
