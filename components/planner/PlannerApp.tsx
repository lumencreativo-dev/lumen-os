'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, X, Share2,
    Check, Star, Repeat, Trash2, Loader2, ExternalLink,
    LayoutGrid, CheckSquare, ArrowLeft, Clock, User,
    Target, Hash, MousePointer, Eye, Link, FileText, Instagram,
    Download, Upload
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PlannerClient { id: string; name: string; color: string; created_at?: string; }
interface PlannerItem {
    id: string; client_id: string; date: string; fmt: string;
    title: string; status: string; note: string; canva_link?: string;
    // Extended fields
    hour?: string; responsible?: string; pillar?: string;
    platforms?: string[]; copy?: string; hashtags?: string;
    cta?: string; visual_idea?: string; material_link?: string; published_link?: string;
    // Runtime flags
    rule?: boolean; ruleId?: string; freq?: string;
}
interface PlannerRule {
    id: string; client_id: string; date: string; freq: string;
    fmt: string; title: string; status: string; note: string;
    hour?: string; responsible?: string; pillar?: string;
    platforms?: string[]; copy?: string; hashtags?: string;
    cta?: string; visual_idea?: string; material_link?: string; published_link?: string;
}
interface PlannerTask {
    id: string; client_id: string; month: string; text: string;
    prio: number; date: string; done: boolean; created_at?: number;
}
interface PlannerMilestone {
    id: string; client_id: string; title: string;
    date: string; recurring: boolean; emoji: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS_FULL = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAYS_SHORT = ['L','M','X','J','V','S','D'];
const FMTS = [
    { name: 'Post',     color: '#1A237E' },
    { name: 'Carrusel', color: '#00838F' },
    { name: 'Historia', color: '#F7931E' },
    { name: 'Reel',     color: '#C2185B' },
];
const STATUSES = ['Idea','En diseno','Por aprobar','Aprobado','Programado','Publicado','Corregir'];
const STATUS_COLORS: Record<string, string> = {
    'Idea': '#9E9E9E', 'En diseno': '#1A237E', 'Por aprobar': '#F7931E',
    'Aprobado': '#00838F', 'Programado': '#2E7D32', 'Publicado': '#5E35B1', 'Corregir': '#C62828',
};
const PLATFORMS_LIST = ['Instagram','Facebook','TikTok','LinkedIn','X','YouTube','WhatsApp'];
const PRIORITIES = [{ label: 'Alta', color: '#C62828' }, { label: 'Media', color: '#EF8F00' }, { label: 'Baja', color: '#2E7D32' }];
const FREQ_LABEL: Record<string, string> = { w: 'semana', m: 'mes', y: 'año' };

// ─── Utils ────────────────────────────────────────────────────────────────────
const uid  = (p: string) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const pad  = (n: number) => String(n).padStart(2, '0');
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; };
const mk   = (year: number, mon: number) => `${year}-${pad(mon+1)}`;
const fmtColor = (name: string) => FMTS.find(f => f.name === name)?.color ?? '#9E9E9E';
const safeHref = (url?: string | null) => (url && url.trim().startsWith('http')) ? url.trim() : null;

function occursOn(rule: PlannerRule, dateStr: string): boolean {
    if (dateStr < rule.date) return false;
    const [y, m, d] = dateStr.split('-').map(Number);
    const [, m0, d0] = rule.date.split('-').map(Number);
    if (rule.freq === 'y') return m === m0 && d === d0;
    if (rule.freq === 'm') return d === Math.min(d0, new Date(y, m, 0).getDate());
    const diff = Math.round((Date.UTC(y,m-1,d) - Date.UTC(...(rule.date.split('-').map(Number)) as [number,number,number])) / 864e5);
    return diff % 7 === 0;
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface PlannerAppProps { mode: 'admin' | 'client'; clientId?: string; }

export function PlannerApp({ mode, clientId: fixedClientId }: PlannerAppProps) {
    const supabase = createClient();

    // ── Data state ──
    const [loading,    setLoading]    = useState(true);
    const [clients,    setClients]    = useState<PlannerClient[]>([]);
    const [items,      setItems]      = useState<PlannerItem[]>([]);
    const [rules,      setRules]      = useState<PlannerRule[]>([]);
    const [tasks,      setTasks]      = useState<PlannerTask[]>([]);
    const [milestones, setMilestones] = useState<PlannerMilestone[]>([]);

    // ── Navigation state ──
    const [screen,    setScreen]    = useState<'home' | 'calendar'>(fixedClientId ? 'calendar' : 'home');
    const [curClient, setCurClient] = useState<string | null>(fixedClientId ?? null);
    const [year,      setYear]      = useState(new Date().getFullYear());
    const [mon,       setMon]       = useState<number | null>(null);
    const [tab,       setTab]       = useState<'calendar' | 'tasks' | 'milestones'>('calendar');
    // Dialog state
    const [dlgDate,   setDlgDate]   = useState<string | null>(null);
    const [fichaItem, setFichaItem] = useState<PlannerItem | null>(null);
    // UI state
    const [newClientName, setNewClientName] = useState('');
    const [copied,        setCopied]        = useState(false);
    const [toast,         setToast]         = useState<string | null>(null);

    // ── Load data ──
    useEffect(() => {
        (async () => {
            setLoading(true);
            const [c, i, r, t, ms] = await Promise.all([
                supabase.from('PlannerClient').select('*').order('created_at'),
                supabase.from('PlannerItem').select('*').order('created_at'),
                supabase.from('PlannerRule').select('*'),
                supabase.from('PlannerTask').select('*').order('created_at'),
                supabase.from('PlannerMilestone').select('*'),
            ]);
            if (c.data)  setClients(c.data);
            if (i.data)  setItems(i.data);
            if (r.data)  setRules(r.data);
            if (t.data)  setTasks(t.data);
            if (ms.data) setMilestones(ms.data);
            if (fixedClientId) { setCurClient(fixedClientId); setScreen('calendar'); }
            setLoading(false);
        })();
    }, []);

    // ── Escape key ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (fichaItem) { setFichaItem(null); return; }
            if (dlgDate)   { setDlgDate(null); return; }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [fichaItem, dlgDate]);

    const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

    // ── Build items with recurring rules expanded for a client ──
    const buildItems = useCallback((clientId: string, forYear: number): PlannerItem[] => {
        const base = items.filter(i => i.client_id === clientId);
        const expanded: PlannerItem[] = [...base];
        const isLeap = new Date(forYear, 1, 29).getMonth() === 1;
        const days   = isLeap ? 366 : 365;
        rules.filter(r => r.client_id === clientId).forEach(rule => {
            for (let j = 0; j < days; j++) {
                const dt = new Date(forYear, 0, 1 + j);
                const k  = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
                if (occursOn(rule, k)) {
                    expanded.push({ ...rule, id: rule.id + '-' + k, client_id: rule.client_id, date: k, rule: true, ruleId: rule.id, freq: rule.freq });
                }
            }
        });
        return expanded;
    }, [items, rules]);

    const milestoneOn = useCallback((clientId: string, date: string): PlannerMilestone[] => {
        const [, m, d] = date.split('-');
        return milestones.filter(ms => {
            if (ms.client_id !== clientId) return false;
            return ms.recurring ? ms.date === `${m}-${d}` : ms.date === date;
        });
    }, [milestones]);

    // ── CRUD: Clients ──
    const addClient = async () => {
        const n = newClientName.trim();
        if (!n) return;
        const id = uid('c');
        const COLORS = ['#F7931E','#1A237E','#00838F','#C2185B','#2E7D32','#5E35B1'];
        const color  = COLORS[clients.length % COLORS.length];
        const cl: PlannerClient = { id, name: n, color };
        setClients(prev => [...prev, cl]);
        setCurClient(id);
        setScreen('calendar');
        setMon(null);
        setNewClientName('');
        const { error } = await supabase.from('PlannerClient').insert(cl);
        if (error) showToast('Error: ' + error.message);
        else showToast(`Cliente "${n}" creado`);
    };

    // ── CRUD: Items ──
    const addItem = async (date: string, freq?: string) => {
        if (!curClient) return;
        const id = uid('i');
        if (freq) {
            const rule: PlannerRule = { id, client_id: curClient, date, freq, fmt: 'Post', title: '', status: 'Idea', note: '' };
            setRules(prev => [...prev, rule]);
            const { error } = await supabase.from('PlannerRule').insert(rule);
            if (error) showToast('Error: ' + error.message);
        } else {
            const item: PlannerItem = { id, client_id: curClient, date, fmt: 'Post', title: '', status: 'Idea', note: '', canva_link: '', platforms: [] };
            setItems(prev => [...prev, item]);
            const { error } = await supabase.from('PlannerItem').insert(item);
            if (error) showToast('Error: ' + error.message);
        }
    };

    const updateItem = async (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => {
        // Strip runtime-only flags from patch
        const { rule: _r, ruleId: _ri, ...cleanPatch } = patch as any;
        if (isRule) {
            // Find the real rule id (runtime ids are rule.id + '-' + date)
            const realRule = rules.find(r => id.startsWith(r.id));
            if (!realRule) return;
            setRules(prev => prev.map(r => r.id === realRule.id ? { ...r, ...cleanPatch } : r));
            // Also update fichaItem if open
            setFichaItem(prev => prev ? { ...prev, ...cleanPatch } : prev);
            await supabase.from('PlannerRule').update(cleanPatch).eq('id', realRule.id);
        } else {
            setItems(prev => prev.map(i => i.id === id ? { ...i, ...cleanPatch } : i));
            setFichaItem(prev => prev && prev.id === id ? { ...prev, ...cleanPatch } : prev);
            await supabase.from('PlannerItem').update(cleanPatch).eq('id', id);
        }
    };

    const deleteItem = async (id: string, isRule?: boolean) => {
        if (isRule) {
            const realRule = rules.find(r => id.startsWith(r.id));
            if (!realRule) return;
            setRules(prev => prev.filter(r => r.id !== realRule.id));
            setFichaItem(null);
            await supabase.from('PlannerRule').delete().eq('id', realRule.id);
        } else {
            setItems(prev => prev.filter(i => i.id !== id));
            setFichaItem(null);
            await supabase.from('PlannerItem').delete().eq('id', id);
        }
    };

    // ── CRUD: Tasks ──
    const addTask = async (text: string, prio: number, date: string) => {
        if (!curClient || !text.trim()) return;
        const id   = uid('t');
        const month = mk(year, mon ?? new Date().getMonth());
        const task: PlannerTask = { id, client_id: curClient, month, text, prio, date, done: false, created_at: Date.now() };
        setTasks(prev => [...prev, task]);
        const { error } = await supabase.from('PlannerTask').insert(task);
        if (error) showToast('Error: ' + error.message);
    };

    const updateTask = async (id: string, patch: Partial<PlannerTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
        await supabase.from('PlannerTask').update(patch as any).eq('id', id);
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await supabase.from('PlannerTask').delete().eq('id', id);
    };

    // ── CRUD: Milestones ──
    const addMilestone = async (title: string, date: string, recurring: boolean, emoji: string) => {
        if (!curClient || !title.trim()) return;
        const id = uid('ms');
        const ms: PlannerMilestone = { id, client_id: curClient, title, date, recurring, emoji };
        setMilestones(prev => [...prev, ms]);
        const { error } = await supabase.from('PlannerMilestone').insert(ms);
        if (error) showToast('Error: ' + error.message);
    };

    const deleteMilestone = async (id: string) => {
        setMilestones(prev => prev.filter(ms => ms.id !== id));
        await supabase.from('PlannerMilestone').delete().eq('id', id);
    };

    // ── Share ──
    const shareUrl = curClient ? `${typeof window !== 'undefined' ? window.location.origin : ''}/planner/${curClient}` : '';
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showToast('Enlace copiado');
        setTimeout(() => setCopied(false), 2000);
    };

    // ── Go to home ──
    const goHome = () => {
        setScreen('home');
        setDlgDate(null);
        setFichaItem(null);
    };

    // ── Go to client calendar ──
    const openClient = (clientId: string, goToCurrentMonth = false) => {
        setCurClient(clientId);
        setScreen('calendar');
        setMon(goToCurrentMonth ? new Date().getMonth() : null);
        setDlgDate(null);
        setFichaItem(null);
        setTab('calendar');
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ── Delete Client ──
    const deleteClient = async (id: string) => {
        const cl = clients.find(c => c.id === id);
        if (!cl) return;
        if (!confirm(`¿Eliminar al cliente "${cl.name}" y todo su contenido? Esta acción no se puede deshacer.`)) return;

        setClients(prev => prev.filter(c => c.id !== id));
        setItems(prev => prev.filter(i => i.client_id !== id));
        setRules(prev => prev.filter(r => r.client_id !== id));
        setTasks(prev => prev.filter(t => t.client_id !== id));
        setMilestones(prev => prev.filter(ms => ms.client_id !== id));

        setCurClient(null);
        setScreen('home');
        showToast(`Cliente "${cl.name}" eliminado`);

        try {
            await Promise.all([
                supabase.from('PlannerItem').delete().eq('client_id', id),
                supabase.from('PlannerRule').delete().eq('client_id', id),
                supabase.from('PlannerTask').delete().eq('client_id', id),
                supabase.from('PlannerMilestone').delete().eq('client_id', id),
                supabase.from('PlannerClient').delete().eq('id', id),
            ]);
        } catch (e: any) {
            console.error('Error al eliminar cliente de Supabase:', e);
        }
    };

    // ── Export JSON ──
    const exportJSON = (clientId?: string) => {
        const targetClients = clientId ? clients.filter(c => c.id === clientId) : clients;
        const targetIds = targetClients.map(c => c.id);
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            clients: targetClients,
            items: items.filter(i => targetIds.includes(i.client_id)),
            rules: rules.filter(r => targetIds.includes(r.client_id)),
            tasks: tasks.filter(t => targetIds.includes(t.client_id)),
            milestones: milestones.filter(m => targetIds.includes(m.client_id)),
        };

        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const namePart = clientId ? (clients.find(c => c.id === clientId)?.name || 'cliente') : 'lumen-todos';
        a.download = `lumen-planner-${namePart.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${year}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showToast('Respaldo JSON descargado');
    };

    // ── Import JSON ──
    const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const text = await file.text();
            const data = JSON.parse(text);

            const importedClients: PlannerClient[] = data.clients || [];
            const importedItems: PlannerItem[] = data.items || [];
            const importedRules: PlannerRule[] = data.rules || [];
            const importedTasks: PlannerTask[] = data.tasks || [];
            const importedMilestones: PlannerMilestone[] = data.milestones || [];

            if (importedClients.length > 0) {
                setClients(prev => {
                    const existingIds = new Set(prev.map(c => c.id));
                    const newOnes = importedClients.filter(c => !existingIds.has(c.id));
                    return [...prev, ...newOnes];
                });
                await supabase.from('PlannerClient').upsert(importedClients);
            }

            if (importedItems.length > 0) {
                setItems(prev => {
                    const existingIds = new Set(prev.map(i => i.id));
                    const newOnes = importedItems.filter(i => !existingIds.has(i.id));
                    return [...prev, ...newOnes];
                });
                await supabase.from('PlannerItem').upsert(importedItems);
            }

            if (importedRules.length > 0) {
                setRules(prev => {
                    const existingIds = new Set(prev.map(r => r.id));
                    const newOnes = importedRules.filter(r => !existingIds.has(r.id));
                    return [...prev, ...newOnes];
                });
                await supabase.from('PlannerRule').upsert(importedRules);
            }

            if (importedTasks.length > 0) {
                setTasks(prev => {
                    const existingIds = new Set(prev.map(t => t.id));
                    const newOnes = importedTasks.filter(t => !existingIds.has(t.id));
                    return [...prev, ...newOnes];
                });
                await supabase.from('PlannerTask').upsert(importedTasks);
            }

            if (importedMilestones.length > 0) {
                setMilestones(prev => {
                    const existingIds = new Set(prev.map(m => m.id));
                    const newOnes = importedMilestones.filter(m => !existingIds.has(m.id));
                    return [...prev, ...newOnes];
                });
                await supabase.from('PlannerMilestone').upsert(importedMilestones);
            }

            showToast('Datos importados correctamente');
        } catch (err: any) {
            console.error('Error importando JSON:', err);
            showToast('Error al leer el archivo JSON');
        } finally {
            e.target.value = '';
        }
    };

    // ─────────────────────────────────────────────────────────────────────────
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

    const client     = clients.find(c => c.id === curClient);
    const allItems   = curClient ? buildItems(curClient, year) : [];

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white">
            {/* ══ Header ══ */}
            <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3 flex-wrap">
                    {/* Logo */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className="w-8 h-8 rounded-xl bg-[#F7931E] flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-white text-sm tracking-tight">LUMEN <span className="text-[#F7931E]">PLANNER</span></span>
                    </div>

                    {/* Nav tabs */}
                    {mode === 'admin' && (
                        <div className="flex items-center gap-1 overflow-x-auto flex-1 scrollbar-hide min-w-0">
                            {/* Home tab */}
                            <button onClick={goHome}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                    screen === 'home'
                                        ? 'bg-white/15 text-white'
                                        : 'text-white/40 hover:text-white/70'
                                }`}>
                                ⌂ Inicio
                            </button>
                            {clients.map(c => (
                                <button key={c.id}
                                    onClick={() => openClient(c.id)}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                        screen === 'calendar' && curClient === c.id
                                            ? 'text-white'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                    style={screen === 'calendar' && curClient === c.id ? { backgroundColor: c.color } : {}}>
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

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
                        {mode === 'admin' && (
                            <>
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                                <button type="button" onClick={() => fileInputRef.current?.click()} title="Importar respaldo JSON"
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all">
                                    <Upload className="w-3.5 h-3.5" />
                                </button>
                                <button type="button" onClick={() => exportJSON(screen === 'calendar' ? curClient || undefined : undefined)} title="Exportar respaldo JSON"
                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all">
                                    <Download className="w-3.5 h-3.5" />
                                </button>
                                <form onSubmit={e => { e.preventDefault(); addClient(); }} className="flex items-center gap-2">
                                    <input value={newClientName} onChange={e => setNewClientName(e.target.value)}
                                        placeholder="Nuevo cliente..."
                                        className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/50 w-36" />
                                    <button type="submit"
                                        className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 transition-all">
                                        <Plus className="w-3 h-3" /> Añadir
                                    </button>
                                </form>
                            </>
                        )}
                        {mode === 'admin' && curClient && screen === 'calendar' && (
                            <button onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                    copied ? 'bg-green-500/20 border-green-500/40 text-green-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                                }`}>
                                {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                {copied ? 'Copiado' : 'Compartir'}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-tabs (only in calendar screen) */}
                {screen === 'calendar' && curClient && (
                    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 pb-2 flex items-center gap-1">
                        {([['calendar','Calendario',Calendar],['tasks','Tareas',CheckSquare],['milestones','Hitos',Star]] as const).map(([key, label, Icon]) => (
                            <button key={key} onClick={() => setTab(key as any)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                                    tab === key ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
                                }`}>
                                <Icon className="w-3 h-3" /> {label}
                            </button>
                        ))}
                        {tab === 'calendar' && (
                            <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => setYear(y => y - 1)} className="text-white/40 hover:text-white p-1 rounded">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-white/70 text-xs font-bold w-10 text-center">{year}</span>
                                <button onClick={() => setYear(y => y + 1)} className="text-white/40 hover:text-white p-1 rounded">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                {mon !== null && (
                                    <button onClick={() => setMon(null)} className="text-white/40 hover:text-white px-2 py-1 rounded text-xs flex items-center gap-1">
                                        <LayoutGrid className="w-3 h-3" /> Año completo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </header>

            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6">
                {screen === 'home' ? (
                    <HomeView
                        clients={clients} tasks={tasks} year={year}
                        setYear={setYear} buildItems={buildItems}
                        onOpenClient={openClient}
                    />
                ) : !curClient ? (
                    <EmptyState mode={mode} />
                ) : tab === 'calendar' ? (
                    <CalendarView
                        mode={mode} year={year} mon={mon} setMon={setMon}
                        allItems={allItems}
                        milestoneOnFn={(date: string) => milestoneOn(curClient, date)}
                        client={client!}
                        dlgDate={dlgDate} setDlgDate={(d: string | null) => { setDlgDate(d); setFichaItem(null); }}
                        fichaItem={fichaItem} setFichaItem={setFichaItem}
                        onAddItem={addItem} onUpdateItem={updateItem} onDeleteItem={deleteItem}
                        onDeleteClient={deleteClient} onExportJSON={exportJSON}
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
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-white/10 text-white text-sm px-4 py-2.5 rounded-xl shadow-2xl">
                    {toast}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// HOME VIEW — Pantalla de inicio con cards de todos los clientes
// ══════════════════════════════════════════════════════════════════════════════
function HomeView({ clients, tasks, year, setYear, buildItems, onOpenClient }: any) {
    const td = todayStr();
    const d7 = new Date(); d7.setDate(d7.getDate() + 7);
    const d7Str = `${d7.getFullYear()}-${String(d7.getMonth()+1).padStart(2,'0')}-${String(d7.getDate()).padStart(2,'0')}`;
    const curMonth = new Date().getMonth();

    return (
        <div>
            {/* Year selector */}
            <div className="flex items-center gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <button onClick={() => setYear((y: number) => y - 1)} className="text-white/40 hover:text-white p-1.5 rounded-lg bg-white/5 transition-all">
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="font-black text-white text-2xl w-16 text-center">{year}</span>
                    <button onClick={() => setYear((y: number) => y + 1)} className="text-white/40 hover:text-white p-1.5 rounded-lg bg-white/5 transition-all">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
                <span className="text-white/30 text-sm">
                    {clients.length} cliente{clients.length !== 1 ? 's' : ''} · elige uno para abrir su calendario
                </span>
            </div>

            {clients.length === 0 ? (
                <EmptyState mode="admin" />
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                    {clients.map((c: PlannerClient) => {
                        const allItems  = buildItems(c.id, year);
                        const yearItems = allItems.filter((i: PlannerItem) => i.date.startsWith(String(year)));
                        const counts: Record<string,number> = {};
                        FMTS.forEach(f => { counts[f.name] = yearItems.filter((i: PlannerItem) => i.fmt === f.name).length; });
                        const total = Object.values(counts).reduce((a, b) => (a as number) + (b as number), 0) as number;

                        const clientTasks = tasks.filter((t: PlannerTask) => t.client_id === c.id && !t.done);
                        const lateTasks   = clientTasks.filter((t: PlannerTask) => t.date && t.date < td);

                        // Agenda: all recurring items for current year
                        const allNow    = buildItems(c.id, new Date().getFullYear());
                        const todayN    = allNow.filter((i: PlannerItem) => i.date === td).length;
                        const next7N    = allNow.filter((i: PlannerItem) => i.date > td && i.date <= d7Str).length;

                        return (
                            <div key={c.id} className="bg-white/3 border border-white/8 rounded-2xl p-5 hover:border-white/20 hover:bg-white/5 transition-all flex flex-col gap-4">
                                {/* Header */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg font-black shrink-0"
                                        style={{ backgroundColor: c.color }}>
                                        {c.name.trim()[0]?.toUpperCase() ?? '?'}
                                    </div>
                                    <span className="font-bold text-white text-base flex-1 min-w-0 truncate">{c.name}</span>
                                    <span className="border border-white/15 text-white/40 text-xs font-semibold rounded-full px-3 py-1 shrink-0 whitespace-nowrap">
                                        {total} en {year}
                                    </span>
                                </div>

                                {/* Format breakdown */}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 bg-white/4 border border-white/8 rounded-xl p-3">
                                    {FMTS.map(f => (
                                        <div key={f.name} className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                            <span className="text-white/50 text-xs flex-1">{f.name === 'Historia' ? 'Historias' : f.name + 's'}</span>
                                            <span className="text-white font-bold text-xs">{counts[f.name]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Tasks row */}
                                <div className="flex justify-between items-center bg-white/4 rounded-xl px-3 py-2.5 text-xs">
                                    <span className="text-white/40">Tareas</span>
                                    <span className="text-white/70">
                                        {clientTasks.length === 0
                                            ? 'Sin tareas pendientes'
                                            : <>{clientTasks.length} pendiente{clientTasks.length !== 1 ? 's' : ''}{lateTasks.length > 0 && <> · <span className="text-red-400">{lateTasks.length} vencida{lateTasks.length !== 1 ? 's' : ''}</span></>}</>
                                        }
                                    </span>
                                </div>

                                {/* Agenda row */}
                                <div className="flex justify-between items-center bg-white/4 rounded-xl px-3 py-2.5 text-xs">
                                    <span className="text-white/40">Agenda cercana</span>
                                    <span className="text-white/70">Hoy: {todayN} · Prox. 7 dias: {next7N}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-1 border-t border-white/5">
                                    <button onClick={() => onOpenClient(c.id, false)}
                                        className="flex-1 text-white text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-90"
                                        style={{ backgroundColor: c.color }}>
                                        Abrir calendario {year}
                                    </button>
                                    <button onClick={() => onOpenClient(c.id, true)}
                                        className="flex-1 bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-semibold py-2.5 rounded-xl transition-all">
                                        Ir a {MONTHS[curMonth].toLowerCase()}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// CALENDAR VIEW
// ══════════════════════════════════════════════════════════════════════════════
function CalendarView({ mode, year, mon, setMon, allItems, milestoneOnFn, client, dlgDate, setDlgDate, fichaItem, setFichaItem, onAddItem, onUpdateItem, onDeleteItem, onDeleteClient, onExportJSON }: any) {
    if (mon !== null) {
        return (
            <MonthView mode={mode} year={year} mon={mon} setMon={setMon}
                allItems={allItems} milestoneOnFn={milestoneOnFn}
                dlgDate={dlgDate} setDlgDate={setDlgDate}
                fichaItem={fichaItem} setFichaItem={setFichaItem}
                onAddItem={onAddItem} onUpdateItem={onUpdateItem} onDeleteItem={onDeleteItem} />
        );
    }

    return (
        <div>
            {/* Summary */}
            <div className="flex flex-wrap gap-3 mb-6">
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

            {/* Year grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {MONTHS.map((month, m) => {
                    const prefix     = `${year}-${pad(m+1)}`;
                    const monthItems = allItems.filter((i: PlannerItem) => i.date.startsWith(prefix));
                    const counts: Record<string,number> = {};
                    FMTS.forEach(f => { counts[f.name] = monthItems.filter((i: PlannerItem) => i.fmt === f.name).length; });
                    return (
                        <MonthCard key={m} month={month} m={m} year={year}
                            items={monthItems} counts={counts} milestoneOnFn={milestoneOnFn}
                            onClick={() => setMon(m)} />
                    );
                })}
            </div>

            {/* Client management footer (admin only) */}
            {mode === 'admin' && client && (
                <div className="mt-12 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <button
                        onClick={() => onExportJSON(client.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all">
                        <Download className="w-3.5 h-3.5" /> Exportar JSON de {client.name}
                    </button>
                    <button
                        onClick={() => onDeleteClient(client.id)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar cliente
                    </button>
                </div>
            )}
        </div>
    );
}

// ── Month card (year overview) ─────────────────────────────────────────────────
function MonthCard({ month, m, year, items, counts, milestoneOnFn, onClick }: any) {
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const firstDay    = (new Date(year, m, 1).getDay() + 6) % 7;
    const td          = todayStr();

    return (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-4 hover:border-white/20 hover:bg-white/5 transition-all cursor-pointer group" onClick={onClick}>
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
            <div className="grid grid-cols-7 gap-0.5">
                {DAYS_SHORT.map(d => <div key={d} className="text-center text-white/20 text-[9px] pb-1">{d}</div>)}
                {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const d       = i + 1;
                    const dateStr = `${year}-${pad(m+1)}-${pad(d)}`;
                    const dayItems= items.filter((it: PlannerItem) => it.date === dateStr);
                    const mss     = milestoneOnFn(dateStr);
                    const isToday = dateStr === td;
                    return (
                        <div key={d} className={`aspect-square rounded-sm flex flex-col items-center justify-center relative ${isToday ? 'bg-[#F7931E]/20 ring-1 ring-[#F7931E]/40' : ''}`}>
                            <span className={`text-[9px] leading-none ${isToday ? 'text-[#F7931E] font-bold' : 'text-white/30'}`}>{d}</span>
                            {dayItems.length > 0 && (
                                <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                                    {dayItems.slice(0,3).map((it: PlannerItem, idx: number) => (
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

// ── Month view (big calendar) ──────────────────────────────────────────────────
function MonthView({ mode, year, mon, setMon, allItems, milestoneOnFn, dlgDate, setDlgDate, fichaItem, setFichaItem, onAddItem, onUpdateItem, onDeleteItem }: any) {
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    const firstDay    = (new Date(year, mon, 1).getDay() + 6) % 7;
    const prefix      = `${year}-${pad(mon+1)}`;
    const monthItems  = allItems.filter((i: PlannerItem) => i.date.startsWith(prefix));
    const td          = todayStr();

    const counts: Record<string,number> = {};
    FMTS.forEach(f => { counts[f.name] = monthItems.filter((i: PlannerItem) => i.fmt === f.name).length; });

    return (
        <div>
            <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <button onClick={() => setMon(null)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button onClick={() => setMon((m: number) => m === 0 ? 11 : m - 1)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h2 className="font-black text-white text-xl">{MONTHS[mon]} <span className="text-white/40">{year}</span></h2>
                    <button onClick={() => setMon((m: number) => m === 11 ? 0 : m + 1)} className="text-white/40 hover:text-white p-1 rounded transition-all">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex flex-wrap gap-3 ml-auto">
                    {FMTS.map(f => (
                        <div key={f.name} className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                            <span className="text-white/40 text-xs">{f.name}s: <strong className="text-white">{counts[f.name]}</strong></span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
                {['Lunes','Martes','Miercoles','Jueves','Viernes','Sabado','Domingo'].map(d => (
                    <div key={d} className="text-center text-white/30 text-xs font-semibold py-1">{d}</div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} className="min-h-[90px]" />)}
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const d       = i + 1;
                    const dateStr = `${year}-${pad(mon+1)}-${pad(d)}`;
                    const dayItems= monthItems.filter((it: PlannerItem) => it.date === dateStr);
                    const mss     = milestoneOnFn(dateStr);
                    const isToday = dateStr === td;
                    return (
                        <button key={d} onClick={() => setDlgDate(dateStr)}
                            className={`min-h-[90px] md:min-h-[110px] rounded-xl p-2 text-left border transition-all hover:border-white/20 hover:bg-white/5 group ${
                                isToday ? 'border-[#F7931E]/40 bg-[#F7931E]/5' : 'border-white/5 bg-white/2'
                            }`}>
                            <div className={`text-sm font-bold mb-1 ${isToday ? 'text-[#F7931E]' : 'text-white/60 group-hover:text-white'}`}>{d}</div>
                            {mss.map((ms: PlannerMilestone) => (
                                <div key={ms.id} className="text-[10px] bg-yellow-400/15 text-yellow-300 rounded px-1 py-0.5 mb-0.5 truncate">
                                    {ms.emoji} {ms.title}
                                </div>
                            ))}
                            {dayItems.slice(0,3).map((it: PlannerItem) => (
                                <div key={it.id} className="text-[10px] rounded px-1 py-0.5 mb-0.5 truncate"
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
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// DAY DIALOG + FICHA COMPLETA
// ══════════════════════════════════════════════════════════════════════════════
function DayDialog({ mode, date, items, milestones, fichaItem, setFichaItem, onClose, onAdd, onUpdate, onDelete }: any) {
    const [yStr, mStr, dStr] = date.split('-');
    const [y, m, day] = [Number(yStr), Number(mStr) - 1, Number(dStr)];
    const dayName  = DAYS_FULL[new Date(y, m, day).getDay()];
    const [freq, setFreq] = useState('');

    const backdropClick = (e: React.MouseEvent) => { if (e.target === e.currentTarget) { if (fichaItem) setFichaItem(null); else onClose(); }};

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 md:p-8 overflow-auto" onClick={backdropClick}>
            <div className="bg-[#111111] border border-white/10 rounded-2xl w-full max-w-2xl shadow-2xl">
                {fichaItem ? (
                    <FichaView item={fichaItem} date={date} onBack={() => setFichaItem(null)} onClose={onClose} onUpdate={onUpdate} onDelete={onDelete} mode={mode} />
                ) : (
                    <>
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

                        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
                            {/* Milestones */}
                            {milestones.length > 0 && (
                                <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-3 mb-2">
                                    <p className="text-yellow-300 text-xs font-semibold mb-1">Hitos del cliente</p>
                                    {milestones.map((ms: PlannerMilestone) => <div key={ms.id} className="text-yellow-200/80 text-sm">{ms.emoji} {ms.title}</div>)}
                                </div>
                            )}

                            {items.length === 0 && <p className="text-white/30 text-sm text-center py-6">No hay contenido planificado para este dia.</p>}

                            {items.map((it: PlannerItem) => (
                                <ContentRowQuick key={it.id} item={it} mode={mode}
                                    onUpdate={onUpdate} onDelete={onDelete}
                                    onOpenFicha={() => setFichaItem(it)} />
                            ))}

                            {/* Add content (admin only) */}
                            {mode === 'admin' && (
                                <div className="pt-3 border-t border-white/5">
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
                    </>
                )}
            </div>
        </div>
    );
}

// ── Quick row in day dialog ────────────────────────────────────────────────────
function ContentRowQuick({ item, mode, onUpdate, onDelete, onOpenFicha }: any) {
    const color    = fmtColor(item.fmt);
    const summary  = [
        item.hour && item.hour,
        item.platforms?.length ? item.platforms.join(' · ') : null,
        item.copy ? 'Con copy' : 'Sin copy',
        item.material_link ? 'Con material' : null,
    ].filter(Boolean).join(' · ');

    return (
        <div className="rounded-xl border transition-all" style={{ borderColor: `${color}30`, backgroundColor: `${color}08` }}>
            {/* Quick row */}
            <div className="flex items-start gap-3 p-3">
                <div className="w-1 self-stretch rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex gap-2 flex-wrap">
                        {mode === 'admin' ? (
                            <input value={item.title} onChange={e => onUpdate(item.id, { title: e.target.value }, item.rule)}
                                placeholder="Titulo / tema..."
                                className="flex-1 min-w-0 bg-transparent text-white text-sm font-semibold outline-none placeholder-white/20" />
                        ) : (
                            <span className="text-white text-sm font-semibold flex-1 truncate">{item.title || item.fmt}</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                        {mode === 'admin' ? (
                            <select value={item.fmt} onChange={e => onUpdate(item.id, { fmt: e.target.value }, item.rule)}
                                className="bg-transparent text-[10px] font-semibold outline-none border-none"
                                style={{ color }}>
                                {FMTS.map(f => <option key={f.name}>{f.name}</option>)}
                            </select>
                        ) : (
                            <span className="text-[10px] font-semibold" style={{ color }}>{item.fmt}</span>
                        )}
                        {item.rule && <span className="text-[10px] text-white/30">↻</span>}
                        {mode === 'admin' ? (
                            <select value={item.status} onChange={e => onUpdate(item.id, { status: e.target.value }, item.rule)}
                                className="bg-white/5 border border-white/10 text-[10px] rounded-full px-2 py-0.5 outline-none"
                                style={{ color: STATUS_COLORS[item.status] || '#9E9E9E' }}>
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        ) : (
                            <span className="text-[10px] rounded-full px-1.5 py-0.5 font-medium"
                                style={{ backgroundColor: `${STATUS_COLORS[item.status] || '#9E9E9E'}20`, color: STATUS_COLORS[item.status] || '#9E9E9E' }}>
                                {item.status}
                            </span>
                        )}
                    </div>
                    {/* Summary + button */}
                    <div className="flex items-center gap-2 pt-1">
                        {summary && <span className="text-white/25 text-[10px] flex-1 truncate">{summary}</span>}
                        <button onClick={onOpenFicha}
                            className="shrink-0 text-[10px] text-[#F7931E]/70 hover:text-[#F7931E] font-semibold transition-all whitespace-nowrap">
                            Ver ficha completa →
                        </button>
                    </div>
                </div>
                {mode === 'admin' && (
                    <button onClick={() => onDelete(item.id, item.rule)} className="text-white/20 hover:text-red-400 p-1 shrink-0 transition-all">
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>
        </div>
    );
}

// ── Ficha Completa ─────────────────────────────────────────────────────────────
function FichaView({ item, date, onBack, onClose, onUpdate, onDelete, mode }: any) {
    const [yStr, mStr, dStr] = date.split('-');
    const [y, m, day] = [Number(yStr), Number(mStr) - 1, Number(dStr)];
    const dayName  = DAYS_FULL[new Date(y, m, day).getDay()];
    const color    = fmtColor(item.fmt);

    const field = (key: keyof PlannerItem, value: any) => onUpdate(item.id, { [key]: value }, item.rule);

    const togglePlatform = (p: string) => {
        const current = item.platforms ?? [];
        const next    = current.includes(p) ? current.filter((x: string) => x !== p) : [...current, p];
        field('platforms', next);
    };

    const freqLabel = item.rule ? (FREQ_LABEL[item.freq || 'w'] || 'semana') : null;

    return (
        <>
            {/* Ficha header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
                <button onClick={onBack} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-all">
                    <ArrowLeft className="w-4 h-4" /> Volver al dia
                </button>
                <button onClick={onClose} className="text-white/30 hover:text-white p-1.5 rounded-lg transition-all">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content title header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/5">
                <div className="flex items-start gap-3">
                    <div className="w-1 self-stretch rounded-full shrink-0 mt-1" style={{ backgroundColor: color }} />
                    <div>
                        <h3 className="text-white font-black text-lg">{item.title || 'Contenido sin titulo'}</h3>
                        <p className="text-white/30 text-xs mt-0.5 capitalize">
                            {dayName} {day} de {MONTHS[m].toLowerCase()} de {date.split('-')[0]}
                            {item.rule && freqLabel && ` · ↻ se repite cada ${freqLabel} (los cambios afectan a todas)`}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form fields */}
            <div className="p-5 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* 1. Titulo (full width) */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><FileText className="w-3 h-3" /> Titulo / Tema</label>
                        <input value={item.title || ''} onChange={e => field('title', e.target.value)}
                            placeholder="Titulo o concepto del contenido..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20" />
                    </div>

                    {/* 2. Formato y Estado */}
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold">Formato</label>
                        <select value={item.fmt} onChange={e => field('fmt', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 disabled:opacity-50">
                            {FMTS.map(f => <option key={f.name}>{f.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold">Estado</label>
                        <select value={item.status} onChange={e => field('status', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 disabled:opacity-50">
                            {STATUSES.map(s => <option key={s}>{s}</option>)}
                        </select>
                    </div>

                    {/* 3. Hora y Responsable */}
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Clock className="w-3 h-3" /> Hora de publicacion</label>
                        <input type="time" value={item.hour || ''} onChange={e => field('hour', e.target.value)}
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 disabled:opacity-50" />
                    </div>
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><User className="w-3 h-3" /> Responsable</label>
                        <input value={item.responsible || ''} onChange={e => field('responsible', e.target.value)}
                            placeholder="Quien lo crea/disena..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                    </div>

                    {/* 4. Pilar (full width) */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Target className="w-3 h-3" /> Pilar u Objetivo</label>
                        <input value={item.pillar || ''} onChange={e => field('pillar', e.target.value)}
                            placeholder="Ej: Educar, Vender, Comunidad, Inspirar..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                    </div>

                    {/* 5. Plataformas (full width) */}
                    <div className="md:col-span-2 space-y-2">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Instagram className="w-3 h-3" /> Plataformas</label>
                        <div className="flex flex-wrap gap-2">
                            {PLATFORMS_LIST.map(p => {
                                const active = (item.platforms ?? []).includes(p);
                                return (
                                    <button key={p} onClick={() => mode === 'admin' && togglePlatform(p)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                                            active
                                                ? 'bg-[#F7931E]/20 border-[#F7931E]/40 text-[#F7931E]'
                                                : 'bg-white/5 border-white/10 text-white/40 hover:text-white/60'
                                        } ${mode === 'client' ? 'cursor-default' : 'cursor-pointer'}`}>
                                        {p}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 6. Copy (full width) */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><FileText className="w-3 h-3" /> Copy / Texto de la publicacion</label>
                        <textarea value={item.copy || ''} onChange={e => field('copy', e.target.value)}
                            placeholder="Escribe el texto que acompanara la publicacion..."
                            rows={6}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 resize-none" />
                    </div>

                    {/* 7. Hashtags */}
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Hash className="w-3 h-3" /> Hashtags</label>
                        <input value={item.hashtags || ''} onChange={e => field('hashtags', e.target.value)}
                            placeholder="#lumen #marketing..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                    </div>

                    {/* 8. CTA */}
                    <div className="space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><MousePointer className="w-3 h-3" /> Llamado a la accion</label>
                        <input value={item.cta || ''} onChange={e => field('cta', e.target.value)}
                            placeholder="Ej: Visita el link en bio, Escribe HOY..."
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                    </div>

                    {/* 9. Idea visual (full width) */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Eye className="w-3 h-3" /> Idea visual / Guion / Indicaciones de diseno</label>
                        <textarea value={item.visual_idea || ''} onChange={e => field('visual_idea', e.target.value)}
                            placeholder="Describe la imagen, escena, colores, referencia visual o guion del video..."
                            rows={5}
                            disabled={mode === 'client'}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 resize-none disabled:opacity-50" />
                    </div>

                    {/* 10. Material link */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><Link className="w-3 h-3" /> Enlace al material (Drive, Canva...)</label>
                        <div className="flex gap-2">
                            <input value={item.material_link || ''} onChange={e => field('material_link', e.target.value)}
                                placeholder="https://drive.google.com/..."
                                disabled={mode === 'client'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                            {safeHref(item.material_link || '') && (
                                <a href={safeHref(item.material_link || '')!} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-[#F7931E]/10 border border-[#F7931E]/30 text-[#F7931E] text-xs px-3 rounded-lg font-semibold whitespace-nowrap hover:bg-[#F7931E]/20 transition-all">
                                    Abrir <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* 11. Published link */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold flex items-center gap-1.5"><ExternalLink className="w-3 h-3" /> Enlace de la publicacion ya publicada</label>
                        <div className="flex gap-2">
                            <input value={item.published_link || ''} onChange={e => field('published_link', e.target.value)}
                                placeholder="https://instagram.com/p/..."
                                disabled={mode === 'client'}
                                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 disabled:opacity-50" />
                            {safeHref(item.published_link || '') && (
                                <a href={safeHref(item.published_link || '')!} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 bg-white/5 border border-white/10 text-white/60 text-xs px-3 rounded-lg font-semibold whitespace-nowrap hover:bg-white/10 transition-all">
                                    Ver <ExternalLink className="w-3 h-3" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* 12. Comentarios del cliente */}
                    <div className="md:col-span-2 space-y-1">
                        <label className="text-white/40 text-xs font-semibold">Comentarios y correcciones del cliente</label>
                        <textarea value={item.note || ''} onChange={e => field('note', e.target.value)}
                            placeholder="Notas del cliente, solicitudes de cambio..."
                            rows={3}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-[#F7931E]/50 placeholder-white/20 resize-none" />
                    </div>
                </div>

                {/* Delete button */}
                {mode === 'admin' && (
                    <div className="pt-4 mt-4 border-t border-white/5 flex justify-end">
                        <button onClick={() => onDelete(item.id, item.rule)}
                            className="flex items-center gap-1.5 text-red-400/60 hover:text-red-400 text-xs transition-all">
                            <Trash2 className="w-3.5 h-3.5" /> Eliminar este contenido
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

// ══════════════════════════════════════════════════════════════════════════════
// TASKS VIEW
// ══════════════════════════════════════════════════════════════════════════════
function TasksView({ tasks, year, mon, onAdd, onUpdate, onDelete }: any) {
    const [text, setText]   = useState('');
    const [prio, setPrio]   = useState(2);
    const [date, setDate]   = useState('');
    const [selMon, setSelMon] = useState(mon);
    const curMonth  = mk(year, selMon);
    const td        = todayStr();
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
            <div className="flex flex-wrap gap-2 mb-6 bg-white/3 border border-white/8 rounded-xl p-3">
                <input value={text} onChange={e => setText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { onAdd(text, prio, date); setText(''); setDate(''); }}}
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
            {monthTasks.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                    <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Sin tareas para {MONTHS[selMon]}.</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {monthTasks.map((t: PlannerTask) => (
                        <div key={t.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${t.done ? 'opacity-40' : ''}`}
                            style={{ borderColor: `${PRIORITIES[(t.prio||2)-1].color}30`, borderLeftColor: PRIORITIES[(t.prio||2)-1].color, borderLeftWidth: 3 }}>
                            <input type="checkbox" checked={t.done} onChange={e => onUpdate(t.id, { done: e.target.checked })}
                                className="w-4 h-4 rounded accent-[#F7931E]" />
                            <input value={t.text} onChange={e => onUpdate(t.id, { text: e.target.value })}
                                className={`flex-1 bg-transparent text-sm text-white outline-none ${t.done ? 'line-through text-white/40' : ''}`} />
                            {t.date && <span className={`text-xs ${t.date < td && !t.done ? 'text-red-400' : 'text-white/30'}`}>{t.date}</span>}
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

// ══════════════════════════════════════════════════════════════════════════════
// MILESTONES VIEW
// ══════════════════════════════════════════════════════════════════════════════
function MilestonesView({ milestones, onAdd, onDelete }: any) {
    const [title,     setTitle]     = useState('');
    const [date,      setDate]      = useState('');
    const [recurring, setRecurring] = useState(true);
    const [emoji,     setEmoji]     = useState('');

    const handleAdd = () => {
        if (!title || !date) return;
        const finalDate = recurring ? date.slice(5) : date;
        onAdd(title, finalDate, recurring, emoji || '⭐');
        setTitle(''); setDate(''); setEmoji('');
    };

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h2 className="font-black text-white text-xl mb-1">Hitos del Cliente</h2>
                <p className="text-white/40 text-sm">Fechas importantes que siempre debes recordar: aniversarios, dias especiales, eventos anuales.</p>
            </div>
            <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-6 space-y-3">
                <div className="flex gap-2">
                    <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nombre del hito..."
                        className="flex-1 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-white/20" />
                    <input value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="Emoji"
                        className="w-20 bg-white/5 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none placeholder-white/20 text-center" />
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        className="bg-white/5 border border-white/10 text-white/60 text-sm rounded-lg px-3 py-2 outline-none" />
                    <label className="flex items-center gap-2 text-white/50 text-sm cursor-pointer">
                        <input type="checkbox" checked={recurring} onChange={e => setRecurring(e.target.checked)} className="w-4 h-4 accent-[#F7931E]" />
                        Se repite cada ano
                    </label>
                    <button onClick={handleAdd} className="ml-auto bg-[#F7931E] text-white text-sm font-semibold px-4 py-2 rounded-lg flex items-center gap-1.5">
                        <Plus className="w-4 h-4" /> Anadir
                    </button>
                </div>
            </div>
            {milestones.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                    <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Sin hitos todavia.</p>
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

// ─── Empty State ──────────────────────────────────────────────────────────────
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
                    : 'Este enlace no es valido o el cliente no existe.'}
            </p>
        </div>
    );
}
