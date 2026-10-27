'use client';

import { useState } from 'react';
import { CheckSquare, Plus, X } from 'lucide-react';
import { PlannerTask } from './types';
import { MONTHS, PRIORITIES, mk, todayStr } from './constants';
import { ConfirmModal } from './ConfirmModal';

interface TasksViewProps {
    tasks: PlannerTask[];
    year: number;
    mon: number;
    onAdd: (text: string, prio: number, date: string) => void;
    onUpdate: (id: string, patch: Partial<PlannerTask>) => void;
    onDelete: (id: string) => void;
}

export function TasksView({ tasks, year, mon, onAdd, onUpdate, onDelete }: TasksViewProps) {
    const [text, setText] = useState('');
    const [prio, setPrio] = useState(2);
    const [date, setDate] = useState('');
    const [selMon, setSelMon] = useState(mon);
    const curMonth = mk(year, selMon);
    const td = todayStr();
    const [taskToDelete, setTaskToDelete] = useState<PlannerTask | null>(null);

    const monthTasks = tasks
        .filter(t => t.month === curMonth)
        .sort((a, b) => +a.done - +b.done || a.prio - b.prio);

    const handleAdd = () => {
        if (!text.trim()) return;
        onAdd(text, prio, date);
        setText('');
        setDate('');
    };

    return (
        <div className="max-w-3xl">
            {/* Header: Title + Month Filter */}
            <div className="flex items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="font-black text-white text-xl sm:text-2xl">Tareas del Mes</h2>
                    <p className="text-white/40 text-xs mt-0.5">Pendientes de producción y diseño para este cliente</p>
                </div>
                <select
                    value={selMon}
                    onChange={e => setSelMon(+e.target.value)}
                    className="bg-[#1C1C1C] border border-white/20 text-white font-bold text-xs sm:text-sm rounded-xl px-4 py-2 outline-none [color-scheme:dark] [&>option]:bg-[#1C1C1C] [&>option]:text-white cursor-pointer shadow-md hover:border-white/40 transition-colors"
                >
                    {MONTHS.map((m, i) => (
                        <option key={i} value={i} className="bg-[#1C1C1C] text-white py-1">
                            {m} {year}
                        </option>
                    ))}
                </select>
            </div>

            {/* Add Task Box */}
            <div className="flex flex-wrap gap-2.5 mb-6 bg-[#161616] border border-white/10 rounded-2xl p-3 shadow-md">
                <input
                    value={text}
                    onChange={e => setText(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter') handleAdd();
                    }}
                    placeholder="Escribe una nueva tarea..."
                    className="flex-1 min-w-[200px] bg-transparent text-white text-sm outline-none placeholder-white/30 px-2 font-medium"
                />
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="bg-[#1C1C1C] border border-white/20 text-white text-xs font-medium rounded-xl px-3 py-2 outline-none [color-scheme:dark]"
                />
                <select
                    value={prio}
                    onChange={e => setPrio(+e.target.value)}
                    className="bg-[#1C1C1C] border border-white/20 text-white text-xs font-semibold rounded-xl px-3 py-2 outline-none [color-scheme:dark] [&>option]:bg-[#1C1C1C] [&>option]:text-white cursor-pointer"
                >
                    {PRIORITIES.map((p, i) => (
                        <option key={i} value={i + 1} className="bg-[#1C1C1C] text-white">
                            Prioridad {p.label}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAdd}
                    className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-[#F7931E]/20 flex items-center gap-1.5"
                >
                    <Plus className="w-3.5 h-3.5" /> Añadir
                </button>
            </div>

            {/* Tasks List */}
            {monthTasks.length === 0 ? (
                <div className="text-center py-14 text-white/30 bg-[#141414] rounded-2xl border border-white/5">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30 text-[#F7931E]" />
                    <p className="text-sm font-medium">Sin tareas pendientes para {MONTHS[selMon]} {year}.</p>
                </div>
            ) : (
                <div className="space-y-2.5">
                    {monthTasks.map(t => {
                        const prioObj = PRIORITIES[(t.prio || 2) - 1] || PRIORITIES[1];
                        return (
                            <div
                                key={t.id}
                                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all ${
                                    t.done ? 'opacity-40 bg-[#121212]' : 'bg-[#181818] hover:bg-[#1E1E1E]'
                                }`}
                                style={{
                                    borderColor: `${prioObj.color}35`,
                                    borderLeftColor: prioObj.color,
                                    borderLeftWidth: 4
                                }}
                            >
                                <input
                                    type="checkbox"
                                    checked={t.done}
                                    onChange={e => onUpdate(t.id, { done: e.target.checked })}
                                    className="w-4 h-4 rounded accent-[#F7931E] cursor-pointer shrink-0"
                                />
                                <input
                                    value={t.text}
                                    onChange={e => onUpdate(t.id, { text: e.target.value })}
                                    className={`flex-1 bg-transparent text-sm text-white font-medium outline-none ${
                                        t.done ? 'line-through text-white/40' : ''
                                    }`}
                                />

                                {/* Explicit Priority Badge */}
                                <span
                                    className="text-[11px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0"
                                    style={{
                                        backgroundColor: `${prioObj.color}20`,
                                        color: prioObj.color,
                                        border: `1px solid ${prioObj.color}50`
                                    }}
                                >
                                    {prioObj.label}
                                </span>

                                {t.date && (
                                    <span
                                        className={`text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/5 shrink-0 ${
                                            t.date < td && !t.done
                                                ? 'text-red-400 font-bold border border-red-500/30'
                                                : 'text-white/50'
                                        }`}
                                    >
                                        {t.date}
                                    </span>
                                )}

                                <button
                                    onClick={() => setTaskToDelete(t)}
                                    className="text-white/30 hover:text-red-400 p-1.5 transition-all rounded-lg hover:bg-white/5 shrink-0"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Custom Confirm Modal for Task Deletion */}
            <ConfirmModal
                isOpen={!!taskToDelete}
                title="Eliminar tarea"
                message={`¿Estás seguro de que deseas eliminar la tarea "${taskToDelete?.text}"?`}
                onConfirm={() => {
                    if (taskToDelete) {
                        onDelete(taskToDelete.id);
                        setTaskToDelete(null);
                    }
                }}
                onCancel={() => setTaskToDelete(null)}
            />
        </div>
    );
}
