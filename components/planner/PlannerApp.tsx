'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, X, Share2,
    Check, Star, Repeat, Trash2, Loader2, ExternalLink,
    LayoutGrid, CheckSquare, ArrowLeft, Clock, User,
    Target, Hash, MousePointer, Eye, Link, FileText, Instagram,
    Download, Upload, Menu, Search, Command, Kanban as KanbanIcon
} from 'lucide-react';

import { PlannerClient, PlannerItem, PlannerRule, PlannerTask, PlannerMilestone } from './types';
import {
    MONTHS, FMTS, pad, uid, todayStr, mk, occursOn
} from './constants';
import { HomeView } from './HomeView';
import { MonthView } from './MonthView';
import { MonthCard } from './MonthCard';
import { KanbanView } from './KanbanView';
import { TasksView } from './TasksView';
import { MilestonesView } from './MilestonesView';
import { QuickSearchModal } from './QuickSearchModal';
import { MobileDrawer } from './MobileDrawer';
import { ConfirmModal } from './ConfirmModal';

export interface PlannerAppProps {
    mode: 'admin' | 'client';
    clientId?: string;
}

export function PlannerApp({ mode, clientId: fixedClientId }: PlannerAppProps) {
    const supabase = createClient();

    // ── Data state ──
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<PlannerClient[]>([]);
    const [items, setItems] = useState<PlannerItem[]>([]);
    const [rules, setRules] = useState<PlannerRule[]>([]);
    const [tasks, setTasks] = useState<PlannerTask[]>([]);
    const [milestones, setMilestones] = useState<PlannerMilestone[]>([]);

    // ── Navigation state ──
    const [screen, setScreen] = useState<'home' | 'calendar'>(fixedClientId ? 'calendar' : 'home');
    const [curClient, setCurClient] = useState<string | null>(fixedClientId ?? null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [mon, setMon] = useState<number | null>(null);
    const [tab, setTab] = useState<'calendar' | 'kanban' | 'tasks' | 'milestones'>('calendar');

    // ── Dialogs & Modals state ──
    const [dlgDate, setDlgDate] = useState<string | null>(null);
    const [fichaItem, setFichaItem] = useState<PlannerItem | null>(null);
    const [searchOpen, setSearchOpen] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [clientToDelete, setClientToDelete] = useState<PlannerClient | null>(null);

    // ── Save Indicator & UI state ──
    const [savingCount, setSavingCount] = useState(0);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [copied, setCopied] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (msg: string) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    // Helper to wrap async operations with the Save Indicator
    const withSaving = async <T,>(operation: () => Promise<T>): Promise<T> => {
        setSavingCount(c => c + 1);
        try {
            const result = await operation();
            return result;
        } finally {
            setSavingCount(c => {
                const next = Math.max(0, c - 1);
                if (next === 0) {
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 1800);
                }
                return next;
            });
        }
    };

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
            if (c.data) setClients(c.data);
            if (i.data) setItems(i.data);
            if (r.data) setRules(r.data);
            if (t.data) setTasks(t.data);
            if (ms.data) setMilestones(ms.data);
            if (fixedClientId) {
                setCurClient(fixedClientId);
                setScreen('calendar');
            }
            setLoading(false);
        })();
    }, [fixedClientId]);

    // ── Keyboard Shortcuts (Desktop) ──
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            // Search shortcut: Cmd+K / Ctrl+K
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setSearchOpen(prev => !prev);
                return;
            }

            // Don't trigger shortcuts if user is typing in an input or textarea
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
                if (e.key === 'Escape') {
                    if (fichaItem) { setFichaItem(null); return; }
                    if (dlgDate) { setDlgDate(null); return; }
                    if (searchOpen) { setSearchOpen(false); return; }
                }
                return;
            }

            if (e.key === 'Escape') {
                if (searchOpen) { setSearchOpen(false); return; }
                if (drawerOpen) { setDrawerOpen(false); return; }
                if (fichaItem) { setFichaItem(null); return; }
                if (dlgDate) { setDlgDate(null); return; }
            }

            if (screen === 'calendar') {
                if (e.key === 'ArrowLeft' && mon !== null) {
                    e.preventDefault();
                    setMon(m => (m === 0 ? 11 : (m as number) - 1));
                } else if (e.key === 'ArrowRight' && mon !== null) {
                    e.preventDefault();
                    setMon(m => (m === 11 ? 0 : (m as number) + 1));
                } else if (e.key.toLowerCase() === 't') {
                    e.preventDefault();
                    setMon(new Date().getMonth());
                } else if (e.key === '1') {
                    setTab('calendar');
                } else if (e.key === '2') {
                    setTab('kanban');
                } else if (e.key === '3') {
                    setTab('tasks');
                } else if (e.key === '4') {
                    setTab('milestones');
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [screen, mon, searchOpen, drawerOpen, fichaItem, dlgDate]);

    // ── Build items with recurring rules expanded for a client ──
    const buildItems = useCallback((clientId: string, forYear: number): PlannerItem[] => {
        const base = items.filter(i => i.client_id === clientId);
        const expanded: PlannerItem[] = [...base];
        const isLeap = new Date(forYear, 1, 29).getMonth() === 1;
        const days = isLeap ? 366 : 365;

        rules.filter(r => r.client_id === clientId).forEach(rule => {
            for (let j = 0; j < days; j++) {
                const dt = new Date(forYear, 0, 1 + j);
                const k = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
                if (occursOn(rule, k)) {
                    expanded.push({
                        ...rule,
                        id: rule.id + '-' + k,
                        client_id: rule.client_id,
                        date: k,
                        rule: true,
                        ruleId: rule.id,
                        freq: rule.freq
                    });
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
    const addClient = async (customName?: string) => {
        const n = (customName || newClientName).trim();
        if (!n) return;
        const id = uid('c');
        const COLORS = ['#F7931E', '#1A237E', '#00838F', '#C2185B', '#2E7D32', '#5E35B1'];
        const color = COLORS[clients.length % COLORS.length];
        const cl: PlannerClient = { id, name: n, color };

        setClients(prev => [...prev, cl]);
        setCurClient(id);
        setScreen('calendar');
        setMon(null);
        setNewClientName('');

        await withSaving(async () => {
            const { error } = await supabase.from('PlannerClient').insert(cl);
            if (error) showToast('Error: ' + error.message);
            else showToast(`Cliente "${n}" creado`);
        });
    };

    const updateClientAvatar = async (clientId: string, avatarUrl: string) => {
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, avatar: avatarUrl } : c));
        await withSaving(async () => {
            await supabase.from('PlannerClient').update({ avatar: avatarUrl }).eq('id', clientId);
            showToast('Logo del cliente actualizado');
        });
    };

    const deleteClient = async (id: string) => {
        const cl = clients.find(c => c.id === id);
        if (!cl) return;

        setClients(prev => prev.filter(c => c.id !== id));
        setItems(prev => prev.filter(i => i.client_id !== id));
        setRules(prev => prev.filter(r => r.client_id !== id));
        setTasks(prev => prev.filter(t => t.client_id !== id));
        setMilestones(prev => prev.filter(ms => ms.client_id !== id));

        setCurClient(null);
        setScreen('home');
        showToast(`Cliente "${cl.name}" eliminado`);

        await withSaving(async () => {
            await Promise.all([
                supabase.from('PlannerItem').delete().eq('client_id', id),
                supabase.from('PlannerRule').delete().eq('client_id', id),
                supabase.from('PlannerTask').delete().eq('client_id', id),
                supabase.from('PlannerMilestone').delete().eq('client_id', id),
                supabase.from('PlannerClient').delete().eq('id', id),
            ]);
        });
    };

    // ── CRUD: Items ──
    const addItem = async (date: string, freq?: string, initialData?: { title?: string; fmt?: string }) => {
        if (!curClient) return;
        const id = uid('i');
        const title = initialData?.title || '';
        const fmt = initialData?.fmt || 'Post';

        if (freq) {
            const rule: PlannerRule = {
                id, client_id: curClient, date, freq, fmt, title, status: 'Idea', note: '', platforms: []
            };
            setRules(prev => [...prev, rule]);
            await withSaving(async () => {
                const { error } = await supabase.from('PlannerRule').insert(rule);
                if (error) showToast('Error: ' + error.message);
            });
        } else {
            const item: PlannerItem = {
                id, client_id: curClient, date, fmt, title, status: 'Idea', note: '', canva_link: '', platforms: []
            };
            setItems(prev => [...prev, item]);
            await withSaving(async () => {
                const { error } = await supabase.from('PlannerItem').insert(item);
                if (error) showToast('Error: ' + error.message);
            });
        }
    };

    const updateItem = async (id: string, patch: Partial<PlannerItem>, isRule?: boolean) => {
        const { rule: _r, ruleId: _ri, ...cleanPatch } = patch as any;
        if (isRule) {
            const realRule = rules.find(r => id.startsWith(r.id));
            if (!realRule) return;
            setRules(prev => prev.map(r => r.id === realRule.id ? { ...r, ...cleanPatch } : r));
            setFichaItem(prev => prev ? { ...prev, ...cleanPatch } : prev);
            await withSaving(async () => {
                await supabase.from('PlannerRule').update(cleanPatch).eq('id', realRule.id);
            });
        } else {
            setItems(prev => prev.map(i => i.id === id ? { ...i, ...cleanPatch } : i));
            setFichaItem(prev => prev && prev.id === id ? { ...prev, ...cleanPatch } : prev);
            await withSaving(async () => {
                await supabase.from('PlannerItem').update(cleanPatch).eq('id', id);
            });
        }
    };

    const deleteItem = async (id: string, isRule?: boolean) => {
        if (isRule) {
            const realRule = rules.find(r => id.startsWith(r.id));
            if (!realRule) return;
            setRules(prev => prev.filter(r => r.id !== realRule.id));
            setFichaItem(null);
            await withSaving(async () => {
                await supabase.from('PlannerRule').delete().eq('id', realRule.id);
            });
        } else {
            setItems(prev => prev.filter(i => i.id !== id));
            setFichaItem(null);
            await withSaving(async () => {
                await supabase.from('PlannerItem').delete().eq('id', id);
            });
        }
    };

    // ── CRUD: Tasks ──
    const addTask = async (text: string, prio: number, date: string) => {
        if (!curClient || !text.trim()) return;
        const id = uid('t');
        const month = mk(year, mon ?? new Date().getMonth());
        const task: PlannerTask = {
            id, client_id: curClient, month, text, prio, date, done: false, created_at: Date.now()
        };
        setTasks(prev => [...prev, task]);
        await withSaving(async () => {
            const { error } = await supabase.from('PlannerTask').insert(task);
            if (error) showToast('Error: ' + error.message);
        });
    };

    const updateTask = async (id: string, patch: Partial<PlannerTask>) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...patch } : t));
        await withSaving(async () => {
            await supabase.from('PlannerTask').update(patch as any).eq('id', id);
        });
    };

    const deleteTask = async (id: string) => {
        setTasks(prev => prev.filter(t => t.id !== id));
        await withSaving(async () => {
            await supabase.from('PlannerTask').delete().eq('id', id);
        });
    };

    // ── CRUD: Milestones ──
    const addMilestone = async (title: string, date: string, recurring: boolean, emoji: string) => {
        if (!curClient || !title.trim()) return;
        const id = uid('ms');
        const ms: PlannerMilestone = { id, client_id: curClient, title, date, recurring, emoji };
        setMilestones(prev => [...prev, ms]);
        await withSaving(async () => {
            const { error } = await supabase.from('PlannerMilestone').insert(ms);
            if (error) showToast('Error: ' + error.message);
        });
    };

    const deleteMilestone = async (id: string) => {
        setMilestones(prev => prev.filter(ms => ms.id !== id));
        await withSaving(async () => {
            await supabase.from('PlannerMilestone').delete().eq('id', id);
        });
    };

    // ── Share & Export/Import ──
    const shareUrl = curClient ? `${typeof window !== 'undefined' ? window.location.origin : ''}/planner/${curClient}` : '';
    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        showToast('Enlace para cliente copiado al portapapeles');
        setTimeout(() => setCopied(false), 2000);
    };

    const exportJSON = (clientId?: string) => {
        const targetClients = clientId ? clients.filter(c => c.id === clientId) : clients;
        const targetIds = targetClients.map(c => c.id);
        const exportData = {
            version: '2.0',
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

            await withSaving(async () => {
                if (importedClients.length > 0) {
                    setClients(prev => {
                        const existingIds = new Set(prev.map(c => c.id));
                        return [...prev, ...importedClients.filter(c => !existingIds.has(c.id))];
                    });
                    await supabase.from('PlannerClient').upsert(importedClients);
                }
                if (importedItems.length > 0) {
                    setItems(prev => {
                        const existingIds = new Set(prev.map(i => i.id));
                        return [...prev, ...importedItems.filter(i => !existingIds.has(i.id))];
                    });
                    await supabase.from('PlannerItem').upsert(importedItems);
                }
                if (importedRules.length > 0) {
                    setRules(prev => {
                        const existingIds = new Set(prev.map(r => r.id));
                        return [...prev, ...importedRules.filter(r => !existingIds.has(r.id))];
                    });
                    await supabase.from('PlannerRule').upsert(importedRules);
                }
                if (importedTasks.length > 0) {
                    setTasks(prev => {
                        const existingIds = new Set(prev.map(t => t.id));
                        return [...prev, ...importedTasks.filter(t => !existingIds.has(t.id))];
                    });
                    await supabase.from('PlannerTask').upsert(importedTasks);
                }
                if (importedMilestones.length > 0) {
                    setMilestones(prev => {
                        const existingIds = new Set(prev.map(m => m.id));
                        return [...prev, ...importedMilestones.filter(m => !existingIds.has(m.id))];
                    });
                    await supabase.from('PlannerMilestone').upsert(importedMilestones);
                }
            });

            showToast('Datos importados correctamente');
        } catch (err: any) {
            console.error('Error importando JSON:', err);
            showToast('Error al leer el archivo JSON');
        } finally {
            e.target.value = '';
        }
    };

    // ── Navigation helpers ──
    const goHome = () => {
        setScreen('home');
        setDlgDate(null);
        setFichaItem(null);
    };

    const openClient = (clientId: string, goToCurrentMonth = false) => {
        setCurClient(clientId);
        setScreen('calendar');
        setMon(goToCurrentMonth ? new Date().getMonth() : null);
        setDlgDate(null);
        setFichaItem(null);
        setTab('calendar');
    };

    const handleSelectSearchResult = (item: PlannerItem) => {
        if (item.client_id !== curClient) {
            setCurClient(item.client_id);
            setScreen('calendar');
        }
        const [, mStr] = item.date.split('-');
        setMon(Number(mStr) - 1);
        setDlgDate(item.date);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-[#F7931E] flex items-center justify-center mx-auto animate-pulse">
                        <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-white/50 text-sm font-semibold tracking-wide">Cargando Lumen Planner...</p>
                </div>
            </div>
        );
    }

    const client = clients.find(c => c.id === curClient);
    const allItems = curClient ? buildItems(curClient, year) : [];
    const allSearchItems = screen === 'calendar' && curClient
        ? allItems
        : items;

    return (
        <div className="min-h-screen bg-[#0D0D0D] text-white flex flex-col pb-20 md:pb-6">
            {/* ══ Header ══ */}
            <header className="sticky top-0 z-30 bg-[#0D0D0D]/95 backdrop-blur-md border-b border-white/5">
                <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-3 flex items-center gap-3">
                    {/* Mobile Hamburger Drawer Trigger */}
                    {mode === 'admin' && (
                        <button
                            onClick={() => setDrawerOpen(true)}
                            className="md:hidden text-white/60 hover:text-white p-2 rounded-xl bg-white/5"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                    )}

                    {/* Logo & Brand */}
                    <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={goHome}>
                        <div className="w-8 h-8 rounded-xl bg-[#F7931E] flex items-center justify-center shadow-lg shadow-[#F7931E]/20">
                            <Calendar className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-white text-sm tracking-tight hidden sm:inline">
                            LUMEN <span className="text-[#F7931E]">PLANNER</span>
                        </span>
                    </div>

                    {/* Improvement #4: Save Indicator */}
                    <div className="flex items-center gap-2 pl-1">
                        {savingCount > 0 ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-[#F7931E] font-medium px-2 py-0.5 rounded-full bg-[#F7931E]/10 border border-[#F7931E]/30 animate-pulse">
                                <span className="w-2 h-2 rounded-full bg-[#F7931E] animate-ping" />
                                Guardando...
                            </span>
                        ) : saveSuccess ? (
                            <span className="flex items-center gap-1.5 text-[11px] text-green-400 font-medium px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30">
                                <Check className="w-3 h-3" /> Guardado
                            </span>
                        ) : null}
                    </div>

                    {/* Desktop Clients Navigation Tabs */}
                    {mode === 'admin' && (
                        <div className="hidden md:flex items-center gap-1.5 overflow-x-auto flex-1 scrollbar-hide min-w-0 px-2">
                            <button
                                onClick={goHome}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                                    screen === 'home'
                                        ? 'bg-white/20 text-white shadow-sm'
                                        : 'text-white/40 hover:text-white/80'
                                }`}
                            >
                                ⌂ Inicio
                            </button>
                            {clients.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => openClient(c.id)}
                                    className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                                        screen === 'calendar' && curClient === c.id
                                            ? 'text-white shadow-md'
                                            : 'text-white/40 hover:text-white/80'
                                    }`}
                                    style={screen === 'calendar' && curClient === c.id ? { backgroundColor: c.color } : {}}
                                >
                                    {c.avatar && (
                                        <img src={c.avatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                    )}
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Client Mode View Header */}
                    {mode === 'client' && client && (
                        <div className="flex-1 flex items-center gap-2 min-w-0">
                            <div
                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0 overflow-hidden"
                                style={{ backgroundColor: client.color }}
                            >
                                {client.avatar ? (
                                    <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                                ) : (
                                    client.name[0].toUpperCase()
                                )}
                            </div>
                            <span className="text-white font-bold text-sm truncate">{client.name}</span>
                            <span className="text-white/40 text-xs hidden sm:inline">· Calendario de Contenidos</span>
                        </div>
                    )}

                    {/* Right Actions: Quick Search, Backup, Share */}
                    <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {/* Quick Search Button (Cmd+K) */}
                        <button
                            onClick={() => setSearchOpen(true)}
                            title="Buscar contenido (Ctrl+K)"
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-semibold transition-all"
                        >
                            <Search className="w-3.5 h-3.5 text-[#F7931E]" />
                            <span className="hidden sm:inline">Buscar</span>
                            <kbd className="hidden lg:inline-block px-1.5 py-0.5 rounded bg-white/10 text-[9px] text-white/50 font-mono">
                                ⌘K
                            </kbd>
                        </button>

                        {mode === 'admin' && (
                            <>
                                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Importar respaldo JSON"
                                    className="hidden sm:flex p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all"
                                >
                                    <Upload className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => exportJSON(screen === 'calendar' ? curClient || undefined : undefined)}
                                    title="Exportar respaldo JSON"
                                    className="hidden sm:flex p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-all"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                </button>

                                <form
                                    onSubmit={e => {
                                        e.preventDefault();
                                        addClient();
                                    }}
                                    className="hidden lg:flex items-center gap-2"
                                >
                                    <input
                                        value={newClientName}
                                        onChange={e => setNewClientName(e.target.value)}
                                        placeholder="Nuevo cliente..."
                                        className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/60 w-32 xl:w-40"
                                    />
                                    <button
                                        type="submit"
                                        className="bg-[#F7931E] hover:bg-[#F7931E]/90 text-white rounded-xl px-3 py-1.5 text-xs font-bold flex items-center gap-1 shadow-md shadow-[#F7931E]/20 transition-all"
                                    >
                                        <Plus className="w-3 h-3" /> Añadir
                                    </button>
                                </form>
                            </>
                        )}

                        {mode === 'admin' && curClient && screen === 'calendar' && (
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    copied
                                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                        : 'bg-white/5 border-white/10 text-white/80 hover:text-white'
                                }`}
                            >
                                {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                <span className="hidden sm:inline">{copied ? 'Copiado' : 'Compartir'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-tabs for Calendar Screen (Desktop) */}
                {screen === 'calendar' && curClient && (
                    <div className="hidden md:flex max-w-screen-2xl mx-auto px-4 md:px-8 pb-2.5 items-center justify-between border-t border-white/5 pt-2">
                        <div className="flex items-center gap-1.5">
                            {([
                                ['calendar', 'Calendario', Calendar],
                                ['kanban', 'Kanban', KanbanIcon],
                                ['tasks', 'Tareas', CheckSquare],
                                ['milestones', 'Hitos', Star]
                            ] as const).map(([key, label, Icon]) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key as any)}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        tab === key
                                            ? 'bg-white/15 text-white shadow-sm'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </div>

                        {tab === 'calendar' && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setYear(y => y - 1)}
                                    className="text-white/40 hover:text-white p-1 rounded-lg"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="text-white font-bold text-xs w-10 text-center">{year}</span>
                                <button
                                    onClick={() => setYear(y => y + 1)}
                                    className="text-white/40 hover:text-white p-1 rounded-lg"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                                {mon !== null && (
                                    <button
                                        onClick={() => setMon(null)}
                                        className="text-white/50 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 text-xs font-medium flex items-center gap-1 transition-all"
                                    >
                                        <LayoutGrid className="w-3 h-3" /> Año completo
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </header>

            {/* ══ Main Content Area with Animated Transitions ══ */}
            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${screen}-${curClient}-${tab}-${year}-${mon}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {screen === 'home' ? (
                            <HomeView
                                clients={clients}
                                tasks={tasks}
                                year={year}
                                setYear={setYear}
                                buildItems={buildItems}
                                onOpenClient={openClient}
                                onUpdateClientAvatar={updateClientAvatar}
                                onDeleteClient={deleteClient}
                                mode={mode}
                            />
                        ) : !curClient ? (
                            <div className="text-center py-24 text-white/30">
                                <Calendar className="w-12 h-12 mx-auto mb-3 text-[#F7931E]/60" />
                                <h2 className="text-white font-bold text-xl mb-1">Ningún cliente seleccionado</h2>
                                <p className="text-xs">Vuelve al inicio para seleccionar o crear un cliente.</p>
                            </div>
                        ) : tab === 'calendar' ? (
                            mon !== null ? (
                                <MonthView
                                    mode={mode}
                                    year={year}
                                    mon={mon}
                                    setMon={setMon}
                                    allItems={allItems}
                                    milestoneOnFn={(date: string) => milestoneOn(curClient, date)}
                                    dlgDate={dlgDate}
                                    setDlgDate={setDlgDate}
                                    fichaItem={fichaItem}
                                    setFichaItem={setFichaItem}
                                    onAddItem={addItem}
                                    onUpdateItem={updateItem}
                                    onDeleteItem={deleteItem}
                                />
                            ) : (
                                <div>
                                    {/* Year Summary Bar */}
                                    <div className="flex flex-wrap gap-3 mb-6">
                                        {FMTS.map(f => {
                                            const total = allItems.filter(i => i.date.startsWith(String(year)) && i.fmt === f.name).length;
                                            return (
                                                <div key={f.name} className="flex items-center gap-2 bg-[#161616] border border-white/5 rounded-2xl px-4 py-2.5 shadow-sm">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: f.color }} />
                                                    <span className="text-white/50 text-xs font-medium">{f.name}s</span>
                                                    <span className="text-white font-bold text-sm">{total}</span>
                                                </div>
                                            );
                                        })}
                                        <div className="flex items-center gap-2 bg-[#F7931E]/10 border border-[#F7931E]/20 rounded-2xl px-4 py-2.5 ml-auto">
                                            <span className="text-[#F7931E] text-xs font-semibold">Total {year}:</span>
                                            <span className="text-[#F7931E] font-black text-sm">
                                                {allItems.filter(i => i.date.startsWith(String(year))).length} piezas
                                            </span>
                                        </div>
                                    </div>

                                    {/* Year Months Grid with Heatmaps */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {MONTHS.map((month, m) => {
                                            const prefix = `${year}-${pad(m + 1)}`;
                                            const monthItems = allItems.filter(i => i.date.startsWith(prefix));
                                            const counts: Record<string, number> = {};
                                            FMTS.forEach(f => {
                                                counts[f.name] = monthItems.filter(i => i.fmt === f.name).length;
                                            });
                                            return (
                                                <MonthCard
                                                    key={m}
                                                    month={month}
                                                    m={m}
                                                    year={year}
                                                    items={monthItems}
                                                    counts={counts}
                                                    milestoneOnFn={(date: string) => milestoneOn(curClient, date)}
                                                    onClick={() => setMon(m)}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Client Management Footer */}
                                    {mode === 'admin' && client && (
                                        <div className="mt-12 pt-6 border-t border-white/5 flex flex-wrap items-center justify-between gap-4">
                                            <button
                                                onClick={() => exportJSON(client.id)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white text-xs font-semibold transition-all"
                                            >
                                                <Download className="w-3.5 h-3.5" /> Exportar JSON de {client.name}
                                            </button>
                                            <button
                                                onClick={() => setClientToDelete(client)}
                                                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 text-xs font-semibold transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" /> Eliminar cliente
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        ) : tab === 'kanban' ? (
                            <KanbanView
                                items={allItems}
                                mode={mode}
                                onUpdateStatus={(id, status, isRule) => updateItem(id, { status }, isRule)}
                                onOpenDay={(date, item) => {
                                    const [, mStr] = date.split('-');
                                    setMon(Number(mStr) - 1);
                                    setDlgDate(date);
                                    if (item) setFichaItem(item);
                                }}
                            />
                        ) : tab === 'tasks' ? (
                            <TasksView
                                tasks={tasks.filter(t => t.client_id === curClient)}
                                year={year}
                                mon={mon ?? new Date().getMonth()}
                                onAdd={addTask}
                                onUpdate={updateTask}
                                onDelete={deleteTask}
                            />
                        ) : (
                            <MilestonesView
                                milestones={milestones.filter(ms => ms.client_id === curClient)}
                                onAdd={addMilestone}
                                onDelete={deleteMilestone}
                            />
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Improvement #11: Fixed Bottom Navigation Bar on Mobile */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0D0D0D]/95 backdrop-blur-lg border-t border-white/10 px-2 py-2 flex items-center justify-around shadow-2xl">
                {mode === 'admin' && (
                    <button
                        onClick={goHome}
                        className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                            screen === 'home' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                        }`}
                    >
                        <span className="text-base leading-none">⌂</span>
                        <span>Inicio</span>
                    </button>
                )}

                {curClient && (
                    <>
                        <button
                            onClick={() => {
                                setScreen('calendar');
                                setTab('calendar');
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                screen === 'calendar' && tab === 'calendar' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Calendario</span>
                        </button>

                        <button
                            onClick={() => {
                                setScreen('calendar');
                                setTab('kanban');
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                screen === 'calendar' && tab === 'kanban' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <KanbanIcon className="w-4 h-4" />
                            <span>Kanban</span>
                        </button>

                        <button
                            onClick={() => {
                                setScreen('calendar');
                                setTab('tasks');
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                screen === 'calendar' && tab === 'tasks' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <CheckSquare className="w-4 h-4" />
                            <span>Tareas</span>
                        </button>

                        <button
                            onClick={() => {
                                setScreen('calendar');
                                setTab('milestones');
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                screen === 'calendar' && tab === 'milestones' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <Star className="w-4 h-4" />
                            <span>Hitos</span>
                        </button>
                    </>
                )}
            </nav>

            {/* Quick Search Modal */}
            <QuickSearchModal
                isOpen={searchOpen}
                onClose={() => setSearchOpen(false)}
                items={allSearchItems}
                onSelectItem={handleSelectSearchResult}
            />

            {/* Mobile Drawer */}
            <MobileDrawer
                isOpen={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                clients={clients}
                curClient={curClient}
                screen={screen}
                onGoHome={goHome}
                onSelectClient={openClient}
                onAddClient={addClient}
                onExportAll={() => exportJSON()}
                onTriggerImport={() => fileInputRef.current?.click()}
            />

            {/* Confirm Modal for Client Deletion */}
            <ConfirmModal
                isOpen={!!clientToDelete}
                title={`Eliminar cliente "${clientToDelete?.name}"`}
                message={`¿Estás seguro de que deseas eliminar permanentemente al cliente "${clientToDelete?.name}" y todo su calendario?`}
                onConfirm={() => {
                    if (clientToDelete) {
                        deleteClient(clientToDelete.id);
                        setClientToDelete(null);
                    }
                }}
                onCancel={() => setClientToDelete(null)}
            />

            {/* Toast Notification */}
            {toast && (
                <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] border border-white/15 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#F7931E]" />
                    {toast}
                </div>
            )}
        </div>
    );
}
