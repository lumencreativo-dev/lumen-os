'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, X, Share2, Link2,
    Check, Star, Repeat, Trash2, Loader2, ExternalLink, Copy,
    LayoutGrid, List, CheckSquare, Milestone, Settings, Home, Image, Video, Film, BookOpen
} from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface PlannerClient { id: string; name: string; color: string; created_at?: string; }
interface PlannerItem {
    id: string; client_id: string; date: string; fmt: string;
    title: string; status: string; note: string; canva_link?: string;
    rule?: boolean; ruleId?: string;
}
interface PlannerRule {
    id: string; client_id: string; date: string; freq: string;
    fmt: string; title: string; status: string; note: string;
}
interface PlannerTask {
    id: string; client_id: string; month: string; text: string;
    prio: number; date: string; done: boolean; created_at?: number;
}
interface PlannerMilestone {
    id: string; client_id: string; title: string;
    date: string; recurring: boolean; emoji: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_SHORT = ['L','M','X','J','V','S','D'];
const FMTS = [
    { name: 'Post', color: '#1A237E', icon: '📸' },
    { name: 'Carrusel', color: '#00838F', icon: '🎠' },
    { name: 'Historia', color: '#F7931E', icon: '📖' },
    { name: 'Reel', color: '#C2185B', icon: '🎬' },
];
const STATUSES = ['Idea','En diseno','Por aprobar','Aprobado','Programado','Publicado','Corregir'];
const STATUS_COLORS: Record<string, string> = {
    'Idea': '#9E9E9E',
    'En diseno': '#1A237E',
    'Por aprobar': '#F7931E',
    'Aprobado': '#00838F',
    'Programado': '#2E7D32',
    'Publicado': '#5E35B1',
    'Corregir': '#C62828',
};
const PRIORITIES = [{ label: 'Alta', color: '#C62828' }, { label: 'Media', color: '#EF8F00' }, { label: 'Baja', color: '#2E7D32' }];

// ─── Utils ─────────────────────────────────────────────────────────────────────
const uid = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const pad = (n: number) => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const mk = (year: number, mon: number) => `${year}-${pad(mon+1)}`;
const fmtColor = (name: string) => FMTS.find(f => f.name === name)?.color ?? '#9E9E9E';

function occursOn(rule: PlannerRule, dateStr: string, year: number): boolean {
    if (dateStr < rule.date) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [, m0, d0] = rule.date.split('-').map(Number);
    if (rule.freq === 'y') return m === m0 && d === d0;
    if (rule.freq === 'm') return d === Math.min(d0, new Date(y, m, 0).getDate());
    const diff = Math.round((Date.UTC(y,m-1,d) - Date.UTC(...rule.date.split('-').map(Number) as [number,number,number])) / 864e5);
    return diff % 7 === 0;
}

// ─── Main Component ─────────────────────────────────────────────────────────────
interface PlannerAppProps { mode: 'admin' | 'client'; clientId?: string; }

export function PlannerApp({ mode, clientId: fixedClientId }: PlannerAppProps) {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<PlannerClient[]>([]);
    const [items, setItems] = useState<PlannerItem[]>([]);
    const [rules, setRules] = useState<PlannerRule[]>([]);
    const [tasks, setTasks] = useState<PlannerTask[]>([]);
    const [milestones, setMilestones] = useState<PlannerMilestone[]>([]);

    const [curClient, setCurClient] = useState<string | null>(fixedClientId ?? null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [mon, setMon] = useState<number | null>(null);
    const [view, setView] = useState<'year' | 'month'>('year');
    const [dlgDate, setDlgDate] = useState<string | null>(null);
    const [tab, setTab] = useState<'calendar' | 'tasks' | 'milestones'>('calendar');
    const [newClientName, setNewClientName] = useState('');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    // ── Load data ──
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const [c, i, r, t, ms] = await Promise.all([
                supabase.from('PlannerClient').select('*').order('created_at'),
                supabase.from('PlannerItem').select('*').order('created_at'),
                supabase.from('PlannerRule').select('*'),
                supabase.from('PlannerTask').select('*').order('created_at'),
                supabase.from('PlannerMilestone').select('*'),
            ]);
            if (c.data) setClients(c.data);
            if (i.data) setItems(i.data);
            if (r.data) setRules(r.data);
            if (t.data) setTasks(t.data);
            if (ms.data) setMilestones(ms.data);

            // In client mode, use the fixed clientId
            if (fixedClientId) setCurClient(fixedClientId);
            else if (c.data && c.data.length > 0 && !curClient) setCurClient(c.data[0].id);
            setLoading(false);
        };
        load();
    }, []);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // ── Build items for current client (including recurring rules) ──
    const buildItems = useCallback((clientId: string): PlannerItem[] => {
        const base = items.filter(i => i.client_id === clientId);
        const expanded: PlannerItem[] = [...base];
        const isLeap = new Date(year, 1, 29).getMonth() === 1;
        const days = isLeap ? 366 : 365;
        rules.filter(r => r.client_id === clientId).forEach(rule => {
            for (let j = 0; j < days; j++) {
                const dt = new Date(year, 0, 1 + j);
                const k = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
                if (occursOn(rule, k, year)) {
                    expanded.push({ ...rule, id: rule.id + '-' + k, client_id: rule.client_id, date: k, rule: true, ruleId: rule.id });
                }
            }
        });
        return expanded;
    }, [items, rules, year]);

    // ── Milestone helper: does a milestone hit on a given date ──
    const milestoneOn = (date: string): PlannerMilestone[] => {
        if (!curClient) return [];
        const [, m, d] = date.split('-');
        return milestones.filter(ms => {
            if (ms.client_id !== curClient) return false;
            if (ms.recurring) return ms.date === `${m}-${d}`;
            return ms.date === date;
        });
    };

    // ── CRUD helpers ──
    const addClient = async () => {
        const n = newClientName.trim();
        if (!n) return;
        const id = uid('c');
        const COLORS = ['#F7931E','#1A237E','#00838F','#C2185B','#2E7D32','#5E35B1'];
        const color = COLORS[clients.length % COLORS.length];
        const cl: PlannerClient = { id, name: n, color };
        setClients(prev => [...prev, cl]);
        setCurClient(id);
        setNewClientName('');
        await supabase.from('PlannerClient').insert(cl);
    };

    const addItem = async (date: string, freq?: string) => {
        if (!curClient) return;
        const id = uid('i');
        if (freq) {
            const rule: PlannerRule = { id, client_id: curClient, date, freq, fmt: 'Post', title: '', status: 'Idea', note: '' };
            setRules(prev => [...prev, rule]);
            await supabase.from('PlannerRule').insert(rule);
        } else {
            const item: PlannerItem = { id, client_id: curClient, date, fmt: 'Post', title: '', status: 'Idea', note: '', canva_link: '' };
            setItems(prev => [...prev, item]);
            await supabase.from('PlannerItem').insert(item);
        }
    };

    const updateItem = async (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => {
        if (isRule) {
            const realId = id.includes('-20') ? id.split('-').slice(0, -1).join('-') : id;
            setRules(prev => prev.map(r => r.id === realId ? { ...r, ...patch } : r));
            await supabase.from('PlannerRule').update(patch as any).eq('id', realId);
        } else {
            setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
            await supabase.from('PlannerItem').update(patch as any).eq('id', id);
        }
    };

    const deleteItem = async (id: string, isRule?: boolean) => {
        if (isRule) {
            const realId = id.includes('-20') ? rules.find(r => id.startsWith(r.id))?.id ?? id : id;
            setRules(prev => prev.filter(r => r.id !== realId));
            await supabase.from('PlannerRule').delete().eq('id', realId);
        } else {
            setItems(prev => prev.filter(i => i.id !== id));
            await supabase.from('PlannerItem').delete().eq('id', id);
        }
    };

    const addTask = async (text: string, prio: number, date: string) => {
        if (!curClient || !text.trim()) return;
        const id = uid('t');
        const task: PlannerTask = { id, client_id: curClient, month: mk(year, mon ?? new Date().getMonth()), text, prio, date, done: false, created_at: Date.now() };
        setTasks(prev => [...prev, task]);
        await supabase.from('PlannerTask').insert(task);
    };

    const updateTask = async (id: string, patch: Partial<PlannerTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
        await supabase.from('PlannerTask').update(patch as any).eq('id', id);
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from('PlannerTask').delete().eq('id', id);
    };

    const addMilestone = async (title: string, date: string, recurring: boolean, emoji: string) => {
        if (!curClient || !title.trim()) return;
        const id = uid('ms');
        const ms: PlannerMilestone = { id, client_id: curClient, title, date, recurring, emoji };
        setMilestones(prev => [...prev, ms]);
        await supabase.from('PlannerMilestone').insert(ms);
    };

    const deleteMilestone = async (id: string) => {
        setMilestones(prev => prev.filter(ms => ms.id !== id));
        await supabase.from('PlannerMilestone').delete().eq('id', id);
    };

    // ── Share URL ──
    const shareUrl = curClient ? `${typeof window !== 'undefined' ? window.location.origin : ''}/planner/${curClient}` : '';
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showToast('Enlace copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Render ──
    if (loading) return (
        <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F7931E] flex items-center justify-center mx-auto animate-pulse">
                    <Calendar className="w-6 h-6 text-white" />
                </div>
                <p className="text-white/50 text-sm">Cargando Planner...</p>
            </div>
        </div>
    );

    const client = clients.find(c => c.id === curClient);
    const allItems = curClient ? buildItems(curClient) : [];

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white font-sans">
            {/* ── Header ── */}
            <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-4">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-[#F7931E] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <span className="font-black text-white text-sm tracking-tight">LUMEN</span>
                            <span className="font-black text-[#F7931E] text-sm ml-1">PLANNER</span>
                        </div>
                    </div>

                    {/* Client tabs (admin only) */}
                    {mode === 'admin' && (
                        <div className="flex items-center gap-2 overflow-x-auto flex-1 scrollbar-hide">
                            {clients.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => { setCurClient(c.id); setMon(null); }}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                        curClient === c.id
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                    style={curClient === c.id ? { backgroundColor: c.color } : {}}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Client mode: show client name */}
                    {mode === 'client' && client && (
                        <div className="flex-1 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black"
                                style={{ backgroundColor: client.color }}>
                                {client.name[0].toUpperCase()}
                            </div>
                            <span className="text-white font-semibold text-sm">{client.name}</span>
                            <span className="text-white/30 text-xs">· Tu Calendario de Contenido</span>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {/* Add client (admin only) */}
                        {mode === 'admin' && (
                            <div className="flex items-center gap-2">
                                <input
                                    value={newClientName}
                                    onChange={e => setNewClientName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addClient()}
                                    placeholder="Nuevo cliente..."
                                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/50 w-36"
                                />
                                <button onClick={addClient}
                                    className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all">
                                    <Plus className="w-3 h-3" /> Añadir
                                </button>
                            </div>
                        )}

                        {/* Share button */}
                        {mode === 'admin' && curClient && (
                            <button onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    copied
                                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white hover:border-white/20'
                                }`}>
                                {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                {copied ? 'Copiado!' : 'Compartir'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-tabs */}
                {curClient && (
                    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pb-2 flex items-center gap-1">
                        {[
                            { key: 'calendar', label: 'Calendario', icon: Calendar },
                            { key: 'tasks', label: 'Tareas', icon: CheckSquare },
                            { key: 'milestones', label: 'Hitos', icon: Star },
                        ].map(({ key, label, icon: Icon }) => (
                            <button key={key}
                                onClick={() => setTab(key as any)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    tab === key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                                }`}>
                                <Icon className="w-3 h-3" /> {label}
                            </button>
                        ))}

                        {tab === 'calendar' && (
                            <div className="ml-auto flex items-center gap-2">
                                {/* Year nav */}
                                <button onClick={() => setYear(y => y - 1)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-white/70 text-xs font-bold w-10 text-center">{year}</span>
                                <button onClick={() => setYear(y => y + 1)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>

                                {/* View toggle */}
                                {mon !== null && (
                                    <button onClick={() => setMon(null)}
                                        className="flex items-center gap-1 text-white/40 hover:text-white px-2 py-1 rounded text-xs transition-all">
                                        <LayoutGrid className="w-3 h-3" /> Año completo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </header>

            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
                {!curClient ? (
                    <EmptyState mode={mode} />
                ) : tab === 'calendar' ? (
                    <CalendarView
                        mode={mode}
                        year={year} mon={mon} setMon={setMon}
                        allItems={allItems}
                        milestoneOn={milestoneOn}
                        client={client!}
                        dlgDate={dlgDate} setDlgDate={setDlgDate}
                        onAddItem={addItem}
                        onUpdateItem={updateItem}
                        onDeleteItem={deleteItem}
                    />
                ) : tab === 'tasks' ? (
                    <TasksView
                        tasks={tasks.filter(t => t.client_id === curClient)}
                        year={year} mon={mon ?? new Date().getMonth()}
                        onAdd={addTask} onUpdate={updateTask} onDelete={deleteTask}
                    />
                ) : (
                    <MilestonesView
                        milestones={milestones.filter(ms => ms.client_id === curClient)}
                        onAdd={addMilestone} onDelete={deleteMilestone}
                    />
                )}
            </main>

            {/* Toast */}
            {toast && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl animate-fade-in">
                    {toast}
                </div>
            )}
        </div>
    );
}

// ─── Calendar View ─────────────────────────────────────────────────────────────
function CalendarView({ mode, year, mon, setMon, allItems, milestoneOn, client, dlgDate, setDlgDate, onAddItem, onUpdateItem, onDeleteItem }: any) {
    if (mon !== null) {
        return (
            <MonthView
                mode={mode} year={year} mon={mon} setMon={setMon}
                allItems={allItems} milestoneOn={milestoneOn}
                dlgDate={dlgDate} setDlgDate={setDlgDate}
                onAddItem={onAddItem} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem}
            />
        );
    }

    // Count per format for the year
    const countsByMonth = MONTHS.map((_, m) => {
        const prefix = `${year}-${pad(m+1)}`;
        const c: Record<string, number> = {};
        FMTS.forEach(f => { c[f.name] = allItems.filter((i: PlannerItem) => i.date.startsWith(prefix) && i.fmt === f.name).length; });
        return c;
    });

    return (
        <div>
            {/* Summary bar */}
            <div className="flex flex-wrap gap-4 mb-6">
                {FMTS.map(f => {
                    const total = allItems.filter((i: PlannerItem) => i.date.startsWith(String(year)) && i.fmt === f.name).length;
                    return (
                        <div key={f.name} className="flex items-center gap-2 bg-white/5 rounded-xl px-4 py-2.5">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="text-white/50 text-xs">{f.name}s</span>
                            <span className="text-white font-bold text-sm">{total}</span>
                        </div>
                    );
                })}
                <div className="flex items-center gap-2 bg-[#F7931E]/10 rounded-xl px-4 py-2.5">
                    <span className="text-[#F7931E]/70 text-xs">Total {year}</span>
                    <span className="text-[#F7931E] font-bold text-sm">
                        {allItems.filter((i: PlannerItem) => i.date.startsWith(String(year))).length}
                    </span>
                </div>
            </div>

            {/* Months grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MONTHS.map((month, m) => {
                    const prefix = `${year}-${pad(m+1)}`;
                    const monthItems = allItems.filter((i: PlannerItem) => i.date.startsWith(prefix));
                    return (
                        <MonthCard key={m} month={month} m={m} year={year}
                            items={monthItems} counts={countsByMonth[m]}
                            milestoneOn={milestoneOn}
                            onClick={() => setMon(m)} />
                    );
                })}
            </div>
        </div>
    );
}

// ─── Month Card (year overview) ────────────────────────────────────────────────
function MonthCard({ month, m, year, items, counts, milestoneOn, onClick }: any) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstDay = (new Date(year, m, 1).getDay() + 6) % 7; // Mon=0

    return (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group"
            onClick={onClick}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-white text-sm group-hover:text-[#F7931E] transition-colors">{month}</h3>
                <div className="flex gap-1.5">
                    {FMTS.map(f => counts[f.name] > 0 && (
                        <div key={f.name} className="flex items-center gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="text-white/40 text-[10px]">{counts[f.name]}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Mini grid */}
            <div className="grid grid-cols-7 gap-0.5">
                {DAYS_SHORT.map(d => <div key={d} className="text-center text-white/20 text-[9px] pb-1">{d}</div>)}
                {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const dateStr = `${year}-${pad(m+1)}-${pad(d)}`;
                    const dayItems = items.filter((it: PlannerItem) => it.date === dateStr);
                    const mss = milestoneOn(dateStr);
                    const isToday = dateStr === today();
                    return (
                        <div key={d} className={`aspect-square rounded-sm flex flex-col items-center justify-center relative ${
                            isToday ? 'bg-[#F7931E]/20 ring-1 ring-[#F7931E]/40' : ''
                        }`}>
                            <span className={`text-[9px] leading-none ${isToday ? 'text-[#F7931E] font-bold' : 'text-white/30'}`}>{d}</span>
                            {dayItems.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                                    {dayItems.slice(0, 3).map((it: PlannerItem, idx: number) => (
                                        <div key={idx} className="w-1 h-1 rounded-full" style={{ backgroundColor: fmtColor(it.fmt) }} />
                                    ))}
                                </div>
                            )}
                            {mss.length > 0 && <div className="absolute top-0 right-0 w-1 h-1 rounded-full bg-yellow-400" />}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ─── Month View (big calendar) ─────────────────────────────────────────────────
function MonthView({ mode, year, mon, setMon, allItems, milestoneOn, dlgDate, setDlgDate, onAddItem, onUpdateItem, onDeleteItem }: any) {
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const firstDay = (new Date(year, mon, 1).getDay() + 6) % 7;
    const monthItems = allItems.filter((i: PlannerItem) => i.date.startsWith(`${year}-${pad(mon+1)}`));

    const counts: Record<string, number> = {};
    FMTS.forEach(f => { counts[f.name] = monthItems.filter((i: PlannerItem) => i.fmt === f.name).length; });

    return (
        <div>
            {/* Month header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMon(null)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => { if (mon === 0) { setMon(11); } else setMon((m: number) => m - 1); }}
                        className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-black text-white text-xl">{MONTHS[mon]} <span className="text-white/40">{year}</span></h2>
                    <button onClick={() => { if (mon === 11) { setMon(0); } else setMon((m: number) => m + 1); }}
                        className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex gap-3 ml-auto">
                    {FMTS.map(f => (
                        <div key={f.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="text-white/40 text-xs">{f.name}s: <strong className="text-white">{counts[f.name]}</strong></span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].map(d => (
                    <div key={d} className="text-center text-white/30 text-xs font-semibold py-1">{d}</div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="aspect-square md:aspect-auto md:min-h-[100px]" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const d = i + 1;
                    const dateStr = `${year}-${pad(mon+1)}-${pad(d)}`;
                    const dayItems = monthItems.filter((it: PlannerItem) => it.date === dateStr);
                    const mss = milestoneOn(dateStr);
                    const isToday = dateStr === today();
                    return (
                        <button key={d}
                            onClick={() => setDlgDate(dateStr)}
                            className={`min-h-[90px] md:min-h-[110px] rounded-xl p-2 text-left border transition-all hover:border-white/20 hover:bg-white/5 group ${
                                isToday ? 'border-[#F7931E]/40 bg-[#F7931E]/5' : 'border-white/5 bg-white/2'
                            }`}>
                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-[#F7931E]' : 'text-white/60 group-hover:text-white'}`}>{d}</div>
                            {mss.map((ms: PlannerMilestone) => (
                                <div key={ms.id} className="text-[10px] bg-yellow-400/15 text-yellow-300 rounded px-1 py-0.5 mb-1 truncate">
                                    {ms.emoji} {ms.title}
                                </div>
                            ))}
                            {dayItems.slice(0, 3).map((it: PlannerItem) => (
                                <div key={it.id}
                                    className="text-[10px] rounded px-1 py-0.5 mb-0.5 truncate"
                                    style={{ backgroundColor: `${fmtColor(it.fmt)}20`, color: fmtColor(it.fmt) }}>
                                    {it.rule ? '↻ ' : ''}{it.title || it.fmt}
                                </div>
                            ))}
                            {dayItems.length > 3 && <div className="text-[10px] text-white/30">+{dayItems.length - 3} mas</div>}
                        </button>
                    );
                })}
            </div>

            {/* Day dialog */}
            {dlgDate && (
                <DayDialog
                    mode={mode}
                    date={dlgDate}
                    items={monthItems.filter((i: PlannerItem) => i.date === dlgDate)}
                    milestones={milestoneOn(dlgDate)}
                    onClose={() => setDlgDate(null)}
                    onAdd={onAddItem}
                    onUpdate={onUpdateItem}
                    onDelete={onDeleteItem}
                    year={year} mon={mon}
                />
            )}
        </div>
    );
}

// ─── Day Dialog ────────────────────────────────────────────────────────────────
function DayDialog({ mode, date, items, milestones, onClose, onAdd, onUpdate, onDelete, year, mon }: any) {
    const [d, m, day] = [date.split('-')[2], date.split('-')[1] - 1, date.split('-')[2]];
    const dayName = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date(date).getDay()];
    const [freq, setFreq] = useState('');
    const [taskText, setTaskText] = useState('');

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    const maxDate = `${year}-${pad(mon+1)}-${pad(new Date(year, mon+1, 0).getDate())}`;
    const minDate = `${year}-${pad(mon+1)}-01`;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-auto"
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <div>
                        <h2 className="font-black text-white text-lg capitalize">{dayName} {day} de {MONTHS[m].toLowerCase()}</h2>
                        <p className="text-white/30 text-xs mt-0.5">{date}</p>
                    </div>
                    <button onClick={onClose} className="text-white/30 hover:text-white p-1.5 rounded-lg transition-all">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                    {/* Milestones */}
                    {milestones.length > 0 && (
                        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3">
                            <p className="text-yellow-300 text-xs font-semibold mb-2">Hitos del cliente</p>
                            {milestones.map((ms: PlannerMilestone) => (
                                <div key={ms.id} className="text-yellow-200/80 text-sm">{ms.emoji} {ms.title}</div>
                            ))}
                        </div>
                    )}

                    {/* Content items */}
                    {items.length === 0 && (
                        <p className="text-white/30 text-sm text-center py-4">No hay contenido planificado para este dia.</p>
                    )}
                    {items.map((it: PlannerItem) => (
                        <ContentRow key={it.id} item={it} mode={mode} onUpdate={onUpdate} onDelete={onDelete} />
                    ))}

                    {/* Add buttons (admin only) */}
                    {mode === 'admin' && (
                        <div className="pt-2 border-t border-white/5">
                            <div className="flex flex-wrap gap-2 items-center">
                                <button onClick={() => onAdd(date)}
                                    className="flex items-center gap-1.5 bg-[#F7931E] hover:bg-[#F7931E]/90 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-all">
                                    <Plus className="w-3 h-3" /> Anadir contenido
                                </button>
                                <select value={freq} onChange={e => setFreq(e.target.value)}
                                    className="bg-white/5 border border-white/10 text-white/60 text-xs rounded-lg px-2 py-2 outline-none">
                                    <option value="">No se repite</option>
                                    <option value="w">Cada semana</option>
                                    <option value="m">Cada mes</option>
                                    <option value="y">Cada ano</option>
                                </select>
                                {freq && (
                                    <button onClick={() => { onAdd(date, freq); setFreq(''); }}
                                        className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs px-3 py-2 rounded-lg transition-all">
                                        <Repeat className="w-3 h-3" /> Agregar recurrente
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Content Row ───────────────────────────────────────────────────────────────
function ContentRow({ item, mode, onUpdate, onDelete }: { item: PlannerItem; mode: string; onUpdate: any; onDelete: any }) {
    const [expanded, setExpanded] = useState(false);
    const color = fmtColor(item.fmt);

    return (
        <div className="rounded-xl border transition-all" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
            <div className="flex items-center gap-3 p-3">
                <div className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0">
                    {mode === 'admin' ? (
                        <input
                            value={item.title}
                            onChange={e => onUpdate(item.id, { title: e.target.value }, item.rule)}
                            placeholder="Titulo / tema..."
                            className="bg-transparent text-white text-sm font-semibold w-full outline-none placeholder-white/20"
                        />
                    ) : (
                        <p className="text-white text-sm font-semibold truncate">{item.title || item.fmt}</p>
                    )}
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-medium" style={{ color }}>{item.rule ? '↻ ' : ''}{item.fmt}</span>
                        <div className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                            style={{ backgroundColor: `${STATUS_COLORS[item.status] || '#9E9E9E'}20`, color: STATUS_COLORS[item.status] || '#9E9E9E' }}>
                            {item.status}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setExpanded(v => !v)}
                        className="text-white/30 hover:text-white p-1 rounded transition-all">
                        <Settings className="w-3.5 h-3.5" />
                    </button>
                    {mode === 'admin' && (
                        <button onClick={() => onDelete(item.id, item.rule)}
                            className="text-white/20 hover:text-red-400 p-1 rounded transition-all">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Expanded fields */}
            {expanded && (
                <div className="px-5 pb-3 space-y-2 border-t border-white/5 pt-3">
                    {mode === 'admin' && (
                        <>
                            <div className="flex gap-2">
                                <select value={item.fmt}
                                    onChange={e => onUpdate(item.id, { fmt: e.target.value }, item.rule)}
                                    className="flex-1 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1.5 outline-none">
                                    {FMTS.map(f => <option key={f.name}>{f.name}</option>)}
                                </select>
                                <select value={item.status}
                                    onChange={e => onUpdate(item.id, { status: e.target.value }, item.rule)}
                                    className="flex-1 bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-2 py-1.5 outline-none">
                                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <input
                                value={item.canva_link || ''}
                                onChange={e => onUpdate(item.id, { canva_link: e.target.value }, item.rule)}
                                placeholder="Link de Canva o Drive..."
                                className="w-full bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-1.5 outline-none placeholder-white/20"
                            />
                        </>
                    )}
                    <textarea
                        value={item.note || ''}
                        onChange={e => mode === 'admin' && onUpdate(item.id, { note: e.target.value }, item.rule)}
                        placeholder={mode === 'admin' ? 'Notas internas...' : 'Comentario de correccion...'}
                        readOnly={mode === 'client' && item.status !== 'Por aprobar'}
                        rows={2}
                        className="w-full bg-white/5 border border-white/10 text-white/70 text-xs rounded-lg px-3 py-1.5 outline-none placeholder-white/20 resize-none"
                    />
                    {item.canva_link && (
                        <a href={item.canva_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-[#F7931E] text-xs hover:underline">
                            <ExternalLink className="w-3 h-3" /> Ver diseno
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Tasks View ────────────────────────────────────────────────────────────────
function TasksView({ tasks, year, mon, onAdd, onUpdate, onDelete }: any) {
    const [text, setText] = useState('');
    const [prio, setPrio] = useState(2);
    const [date, setDate] = useState('');
    const [selMon, setSelMon] = useState(mon);
    const curMonth = mk(year, selMon);
    const monthTasks = tasks.filter((t: PlannerTask) => t.month === curMonth)
        .sort((a: PlannerTask, b: PlannerTask) => +a.done - +b.done || a.prio - b.prio);

    return (
        <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <h2 className="font-black text-white text-xl">Tareas</h2>
                <select value={selMon} onChange={e => setSelMon(+e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/70 text-sm rounded-lg px-3 py-1.5 outline-none ml-auto">
                    {MONTHS.map((m, i) => <option key={i} value={i}>{m} {year}</option>)}
                </select>
            </div>

            {/* Add task */}
            <div className="flex flex-wrap gap-2 mb-6 bg-white/3 border border-white/8 rounded-xl p-3">
                <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (onAdd(text, prio, date), setText(''), setDate(''))}
                    placeholder="Nueva tarea..."
                    className="flex-1 min-w-[160px] bg-transparent text-white text-sm outline-none placeholder-white/20" />
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg px-2 py-1.5 outline-none" />
                <select value={prio} onChange={e => setPrio(+e.target.value)}
                    className="bg-white/5 border border-white/10 text-white/50 text-xs rounded-lg px-2 py-1.5 outline-none">
                    {PRIORITIES.map((p, i) => <option key={i} value={i+1}>{p.label}</option>)}
                </select>
                <button onClick={() => { onAdd(text, prio, date); setText(''); setDate(''); }}
                    className="bg-[#F7931E] text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <Plus className="w-3.5 h-3.5" />
                </button>
            </div>

            {/* Tasks list */}
            {monthTasks.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Sin tareas para {MONTHS[selMon]}. Escribe la primera arriba.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {monthTasks.map((t: PlannerTask) => (
                        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${t.done ? 'opacity-40' : ''}`}
                            style={{ borderColor: `${PRIORITIES[(t.prio||2)-1].color}30`, borderLeftColor: PRIORITIES[(t.prio||2)-1].color, borderLeftWidth: 3 }}>
                            <input type="checkbox" checked={t.done}
                                onChange={e => onUpdate(t.id, { done: e.target.checked })}
                                className="w-4 h-4 rounded accent-[#F7931E]" />
                            <input value={t.text}
                                onChange={e => onUpdate(t.id, { text: e.target.value })}
                                className={`flex-1 bg-transparent text-sm text-white outline-none ${t.done ? 'line-through text-white/40' : ''}`} />
                            {t.date && (
                                <span className={`text-xs ${t.date < today() && !t.done ? 'text-red-400' : 'text-white/30'}`}>{t.date}</span>
                            )}
                            <button onClick={() => onDelete(t.id)} className="text-white/20 hover:text-red-400 p-1 transition-all">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Milestones View ───────────────────────────────────────────────────────────
function MilestonesView({ milestones, onAdd, onDelete }: any) {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [recurring, setRecurring] = useState(true);
    const [emoji, setEmoji] = useState('');

    const handleAdd = () => {
        if (!title || !date) return;
        // For recurring, store only MM-DD; for one-time store full YYYY-MM-DD
        const finalDate = recurring ? date.slice(5) : date; // MM-DD vs YYYY-MM-DD
        onAdd(title, finalDate, recurring, emoji || 'star');
        setTitle(''); setDate(''); setEmoji('');
    };

    const EMOJI_OPTIONS = ['star','birthday','church','heart','event','gift'];

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h2 className="font-black text-white text-xl mb-1">Hitos del Cliente</h2>
                <p className="text-white/40 text-sm">Fechas importantes que siempre debes recordar: aniversarios, dias especiales, eventos anuales.</p>
            </div>

            {/* Add milestone */}
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex gap-2">
                    <input value={title} onChange={e => setTitle(e.target.value)}
                        placeholder="Nombre del hito (ej: Aniversario de fundacion)..."
                        className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-white/20" />
                    <input value={emoji} onChange={e => setEmoji(e.target.value)}
                        placeholder="Emoji"
                        className="w-20 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-white/20 text-center" />
                </div>
                <div className="flex gap-3 items-center">
                    <input type={recurring ? 'date' : 'date'} value={date} onChange={e => setDate(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none" />
                    <label className="flex items-center gap-2 text-white/50 text-sm cursor-pointer">
                        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)}
                            className="w-4 h-4 accent-[#F7931E]" />
                        Se repite cada ano
                    </label>
                    <button onClick={handleAdd}
                        className="ml-auto bg-[#F7931E] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Anadir
                    </button>
                </div>
            </div>

            {/* List */}
            {milestones.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Sin hitos todavia. Agrega las fechas importantes del cliente.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {milestones.map((ms: PlannerMilestone) => (
                        <div key={ms.id} className="flex items-center gap-3 p-3 bg-yellow-400/5 border border-yellow-400/15 rounded-xl">
                            <span className="text-xl">{ms.emoji && ms.emoji.length <= 2 ? ms.emoji : '⭐'}</span>
                            <div className="flex-1">
                                <p className="text-white text-sm font-semibold">{ms.title}</p>
                                <p className="text-white/40 text-xs">{ms.recurring ? `Cada ano el ${ms.date}` : ms.date} · {ms.recurring ? 'Recurrente' : 'Unico'}</p>
                            </div>
                            <button onClick={() => onDelete(ms.id)} className="text-white/20 hover:text-red-400 p-1 transition-all">
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
function EmptyState({ mode }: { mode: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F7931E]/10 flex items-center justify-center mb-4">
                <Calendar className="w-8 h-8 text-[#F7931E]/60" />
            </div>
            <h2 className="text-white font-black text-2xl mb-2">
                {mode === 'admin' ? 'Aun no hay clientes' : 'Calendario no disponible'}
            </h2>
            <p className="text-white/30 text-sm max-w-sm">
                {mode === 'admin'
                    ? 'Escribe el nombre de tu primer cliente en la barra de arriba y presiona "Anadir" para comenzar.'
                    : 'Este enlace no es valido o el cliente no existe. Contacta a tu equipo de Lumen Creativo.'}
            </p>
        </div>
    );
}
