'use client';

import { useState } from 'react';
import { Star, Plus, Trash2 } from 'lucide-react';
import { PlannerMilestone } from './types';
import { ConfirmModal } from './ConfirmModal';

interface MilestonesViewProps {
    milestones: PlannerMilestone[];
    onAdd: (title: string, date: string, recurring: boolean, emoji: string) => void;
    onDelete: (id: string) => void;
}

export function MilestonesView({ milestones, onAdd, onDelete }: MilestonesViewProps) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [recurring, setRecurring] = useState(true);
    const [emoji, setEmoji] = useState('⭐');
    const [msToDelete, setMsToDelete] = useState<PlannerMilestone | null>(null);

    const handleAdd = () => {
        if (!title.trim() || !date) return;
        const finalDate = recurring ? date.slice(5) : date;
        onAdd(title.trim(), finalDate, recurring, emoji || '⭐');
        setTitle('');
        setDate('');
        setEmoji('⭐');
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h2 className="font-black text-white text-xl sm:text-2xl mb-1">Hitos & Fechas Importantes</h2>
                <p className="text-white/40 text-sm">
                    Aniversarios, días especiales o temporadas comerciales clave del cliente que se deben contemplar cada año.
                </p>
            </div>

            {/* Add Milestone Form */}
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-4 mb-6 space-y-3 shadow-md">
                <div className="flex gap-2">
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        placeholder="Nombre del hito (ej: Aniversario de la empresa)..."
                        className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-white/30 focus:border-[#F7931E]/60"
                    />
                    <input
                        value={emoji}
                        onChange={e => setEmoji(e.target.value)}
                        placeholder="Emoji"
                        className="w-16 bg-white/5 border border-white/10 text-white text-sm rounded-xl px-2 py-2 outline-none text-center focus:border-[#F7931E]/60"
                    />
                </div>

                <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="bg-[#1C1C1C] border border-white/20 text-white/80 text-xs font-semibold rounded-xl px-3 py-2 outline-none [color-scheme:dark]"
                        />
                        <label className="flex items-center gap-2 text-white/60 text-xs font-medium cursor-pointer">
                            <input
                                type="checkbox"
                                checked={recurring}
                                onChange={e => setRecurring(e.target.checked)}
                                className="w-4 h-4 rounded accent-[#F7931E]"
                            />
                            Se repite cada año
                        </label>
                    </div>

                    <button
                        onClick={handleAdd}
                        className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F7931E]/20 flex items-center gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Añadir Hito
                    </button>
                </div>
            </div>

            {/* Milestones List */}
            {milestones.length === 0 ? (
                <div className="text-center py-14 text-white/30 bg-[#141414] rounded-2xl border border-white/5">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-30 text-amber-400" />
                    <p className="text-sm font-medium">Sin hitos registrados todavía.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {milestones.map(ms => (
                        <div
                            key={ms.id}
                            className="flex items-center gap-3.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl hover:bg-amber-500/10 transition-all"
                        >
                            <span className="text-2xl">{ms.emoji || '⭐'}</span>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-sm font-bold truncate">{ms.title}</p>
                                <p className="text-amber-200/60 text-xs">
                                    {ms.recurring ? `Cada año el ${ms.date}` : ms.date} · {ms.recurring ? 'Anual recurrente' : 'Fecha única'}
                                </p>
                            </div>
                            <button
                                onClick={() => setMsToDelete(ms)}
                                className="text-white/30 hover:text-red-400 p-2 rounded-xl hover:bg-white/5 transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Confirm Deletion Modal */}
            <ConfirmModal
                isOpen={!!msToDelete}
                title="Eliminar hito"
                message={`¿Estás seguro de que deseas eliminar el hito "${msToDelete?.title}"?`}
                onConfirm={() => {
                    if (msToDelete) {
                        onDelete(msToDelete.id);
                        setMsToDelete(null);
                    }
                }}
                onCancel={() => setMsToDelete(null)}
            />
        </div>
    );
}
