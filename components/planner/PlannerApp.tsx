'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, ChevronLeft, ChevronRight, Plus, X, Share2,
    Check, Star, Repeat, Trash2, Loader2, ExternalLink,
    LayoutGrid, CheckSquare, ArrowLeft, Clock, User,
    Target, Hash, MousePointer, Eye, Link, FileText, Instagram,
    Download, Upload, Menu, Search, Command, Kanban as KanbanIcon,
    ListOrdered, Users, BarChart3, Mail, Sparkles
} from 'lucide-react';

import {
    PlannerClient, PlannerItem, PlannerRule, PlannerTask,
    PlannerMilestone, SuiteLead, SuiteMetric, LeadStage
} from './types';
import {
    MONTHS, FMTS, pad, uid, todayStr, mk, occursOn
} from './constants';
import { HomeView } from './HomeView';
import { MonthView } from './MonthView';
import { MonthCard } from './MonthCard';
import { KanbanView } from './KanbanView';
import { TasksView } from './TasksView';
import { MilestonesView } from './MilestonesView';
import { ProductionQueue } from './ProductionQueue';
import { CrmView } from './CrmView';
import { MetricsView } from './MetricsView';
import { EmailModulePlaceholder } from './EmailModulePlaceholder';
import { QuickSearchModal } from './QuickSearchModal';
import { MobileDrawer } from './MobileDrawer';
import { ConfirmModal } from './ConfirmModal';
import { DayDialog } from './DayDialog';

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
    const [leads, setLeads] = useState<SuiteLead[]>([]);
    const [metrics, setMetrics] = useState<SuiteMetric[]>([]);

    // ── Suite Modules Navigation ──
    const [suiteModule, setSuiteModule] = useState<'content' | 'crm' | 'metrics' | 'email'>('content');

    // ── Navigation state (Content Module) ──
    const [screen, setScreen] = useState<'home' | 'calendar' | 'queue'>(fixedClientId ? 'calendar' : 'home');
    const [curClient, setCurClient] = useState<string | null>(fixedClientId ?? null);
    const [year, setYear] = useState(new Date().getFullYear());
    const [mon, setMon] = useState<number | null>(null);
    const [tab, setTab] = useState<'calendar' | 'kanban' | 'tasks' | 'milestones' | 'queue'>('calendar');

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
            
            let fetchedItems: PlannerItem[] = i.data || [];
            // Regla de Auto-publicación: pasar de 'Programado' a 'Publicado' si fecha <= hoy
            const today = todayStr();
            const toAutoPublish = fetchedItems.filter(item => item.status === 'Programado' && item.date <= today);
            if (toAutoPublish.length > 0) {
                const autoIds = toAutoPublish.map(x => x.id);
                fetchedItems = fetchedItems.map(item => autoIds.includes(item.id) ? { ...item, status: 'Publicado' } : item);
                // Actualizar en segundo plano en Supabase
                supabase.from('PlannerItem').update({ status: 'Publicado' }).in('id', autoIds).then(({ error }) => {
                    if (!error) {
                        showToast(`⚡ ${toAutoPublish.length} pieza(s) programada(s) actualizada(s) a Publicadas`);
                    }
                });
            }
            setItems(fetchedItems);

            if (r.data) setRules(r.data);
            if (t.data) setTasks(t.data);
            if (ms.data) setMilestones(ms.data);

            // Cargar Leads del CRM
            try {
                const { data: ldData } = await supabase.from('PlannerLead').select('*').order('created_at', { ascending: false });
                if (ldData && ldData.length > 0) {
                    setLeads(ldData);
                } else {
                    const local = localStorage.getItem('lumen_suite_leads');
                    if (local) setLeads(JSON.parse(local));
                }
            } catch {
                const local = localStorage.getItem('lumen_suite_leads');
                if (local) setLeads(JSON.parse(local));
            }

            // Cargar Métricas
            try {
                const { data: mtData } = await supabase.from('PlannerMetric').select('*').order('created_at', { ascending: false });
                if (mtData && mtData.length > 0) {
                    setMetrics(mtData);
                } else {
                    const local = localStorage.getItem('lumen_suite_metrics');
                    if (local) setMetrics(JSON.parse(local));
                }
            } catch {
                const local = localStorage.getItem('lumen_suite_metrics');
                if (local) setMetrics(JSON.parse(local));
            }

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
        const targetClient = fichaItem?.client_id || curClient;
        if (!targetClient) return;
        const id = uid('i');
        const title = initialData?.title || '';
        const fmt = initialData?.fmt || 'Post';

        if (freq) {
            const rule: PlannerRule = {
                id, client_id: targetClient, date, freq, fmt, title, status: 'Idea', note: '', platforms: []
            };
            setRules(prev => [...prev, rule]);
            await withSaving(async () => {
                const { error } = await supabase.from('PlannerRule').insert(rule);
                if (error) showToast('Error: ' + error.message);
            });
        } else {
            const item: PlannerItem = {
                id, client_id: targetClient, date, fmt, title, status: 'Idea', note: '', canva_link: '', platforms: []
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

    // ── CRUD: Leads (CRM) ──
    const addLead = async (leadData: Omit<SuiteLead, 'id' | 'created_at'>) => {
        const id = uid('lead');
        const newLead: SuiteLead = {
            ...leadData,
            id,
            created_at: new Date().toISOString()
        };
        const updated = [newLead, ...leads];
        setLeads(updated);
        localStorage.setItem('lumen_suite_leads', JSON.stringify(updated));
        showToast(`Prospecto "${newLead.name}" creado`);

        await withSaving(async () => {
            await supabase.from('PlannerLead').insert(newLead);
        });
    };

    const updateLead = async (id: string, patch: Partial<SuiteLead>) => {
        const updated = leads.map(l => l.id === id ? { ...l, ...patch } : l);
        setLeads(updated);
        localStorage.setItem('lumen_suite_leads', JSON.stringify(updated));

        await withSaving(async () => {
            await supabase.from('PlannerLead').update(patch).eq('id', id);
        });
    };

    const deleteLead = async (id: string) => {
        const updated = leads.filter(l => l.id !== id);
        setLeads(updated);
        localStorage.setItem('lumen_suite_leads', JSON.stringify(updated));

        await withSaving(async () => {
            await supabase.from('PlannerLead').delete().eq('id', id);
        });
    };

    const convertLeadToClient = async (lead: SuiteLead) => {
        await addClient(lead.name);
        await updateLead(lead.id, { stage: 'ganado' });
        setSuiteModule('content');
        showToast(`🎉 ¡"${lead.name}" ahora es un cliente en la Suite!`);
    };

    // ── CRUD: Metrics ──
    const saveMetric = async (metricData: Omit<SuiteMetric, 'id' | 'created_at'>) => {
        const id = uid('mt');
        const newMetric: SuiteMetric = {
            ...metricData,
            id,
            created_at: new Date().toISOString()
        };
        const existingIdx = metrics.findIndex(
            m => m.client_id === metricData.client_id && m.platform === metricData.platform && m.period === metricData.period
        );
        let updated: SuiteMetric[];
        if (existingIdx >= 0) {
            updated = [...metrics];
            updated[existingIdx] = { ...updated[existingIdx], ...metricData };
        } else {
            updated = [newMetric, ...metrics];
        }
        setMetrics(updated);
        localStorage.setItem('lumen_suite_metrics', JSON.stringify(updated));
        showToast(`Métricas de ${metricData.platform} guardadas`);

        await withSaving(async () => {
            await supabase.from('PlannerMetric').upsert(updated[existingIdx >= 0 ? existingIdx : 0]);
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

    const allClientsItems = useMemo(() => {
        const itemMap = new Map<string, PlannerItem>();
        const curY = new Date().getFullYear();
        for (const cl of clients) {
            const thisYearItems = buildItems(cl.id, curY);
            const nextYearItems = buildItems(cl.id, curY + 1);
            for (const it of [...thisYearItems, ...nextYearItems]) {
                itemMap.set(it.id, it);
            }
        }
        return Array.from(itemMap.values());
    }, [clients, buildItems]);

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
        : allClientsItems;

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

                    {/* Logo & Brand: Lumen Creativo Suite */}
                    <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => {
                        setSuiteModule('content');
                        goHome();
                    }}>
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#F7931E] to-[#FF6B00] flex items-center justify-center shadow-lg shadow-[#F7931E]/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-black text-white text-sm tracking-tight hidden sm:inline">
                            LUMEN <span className="text-[#F7931E]">SUITE</span>
                        </span>
                    </div>

                    {/* Suite Module Switcher (Desktop) */}
                    {mode === 'admin' && (
                        <div className="hidden lg:flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 ml-1 shrink-0">
                            <button
                                onClick={() => setSuiteModule('content')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    suiteModule === 'content'
                                        ? 'bg-[#F7931E] text-white shadow-sm font-bold'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Contenidos</span>
                            </button>

                            <button
                                onClick={() => setSuiteModule('crm')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    suiteModule === 'crm'
                                        ? 'bg-[#F7931E] text-white shadow-sm font-bold'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                <span>CRM Leads</span>
                                {leads.filter(l => l.followup_date === todayStr() && l.stage !== 'ganado' && l.stage !== 'perdido').length > 0 && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                )}
                            </button>

                            <button
                                onClick={() => setSuiteModule('metrics')}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    suiteModule === 'metrics'
                                        ? 'bg-[#F7931E] text-white shadow-sm font-bold'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5" />
                                <span>Métricas</span>
                            </button>

                            <button
                                onClick={() => setSuiteModule('email')}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    suiteModule === 'email'
                                        ? 'bg-[#F7931E] text-white shadow-sm font-bold'
                                        : 'text-white/40 hover:text-white'
                                }`}
                            >
                                <Mail className="w-3.5 h-3.5" />
                                <span>Correo</span>
                                <span className="text-[9px] px-1 py-0.2 rounded bg-white/10 text-white/50 font-mono">Próx</span>
                            </button>
                        </div>
                    )}

                    {/* Save Indicator */}
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

                    {/* Center Navigation when in Contenidos module */}
                    {mode === 'admin' && suiteModule === 'content' && (
                        <div className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 rounded-2xl p-1 shrink-0">
                            <button
                                onClick={goHome}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    screen === 'home'
                                        ? 'bg-white/15 text-white font-bold shadow-sm'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <span>⌂ Inicio</span>
                            </button>
                            <button
                                onClick={() => {
                                    setScreen('queue');
                                    setDlgDate(null);
                                    setFichaItem(null);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                                    screen === 'queue'
                                        ? 'bg-[#F7931E] text-white font-bold shadow-sm'
                                        : 'text-white/50 hover:text-white'
                                }`}
                            >
                                <ListOrdered className="w-3.5 h-3.5" />
                                <span>Cola Global</span>
                            </button>
                        </div>
                    )}

                    {/* Spacer to push actions to the right */}
                    <div className="flex-1" />

                    {/* Client Mode View Header */}
                    {mode === 'client' && client && (
                        <div className="flex items-center gap-2 min-w-0">
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
                    <div className="flex items-center gap-2 shrink-0">
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
            </header>

            {/* ══ Client Context Bar (below header, only when inside a client's calendar) ══ */}
            {mode === 'admin' && screen === 'calendar' && curClient && (
                <div className="sticky top-[57px] z-20 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-2 flex items-center gap-3">
                        {/* Back to Inicio */}
                        <button
                            onClick={goHome}
                            className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs font-medium transition-all shrink-0"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Inicio</span>
                        </button>
                        <span className="text-white/15 text-xs">›</span>

                        {/* Client Switcher Dropdown */}
                        <div className="relative group/client">
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all"
                            >
                                <div
                                    className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden"
                                    style={{ backgroundColor: client?.color || '#F7931E' }}
                                >
                                    {client?.avatar ? (
                                        <img src={client.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        client?.name?.[0]?.toUpperCase() ?? '?'
                                    )}
                                </div>
                                <span className="text-white font-bold text-xs">{client?.name}</span>
                                <ChevronRight className="w-3 h-3 text-white/30 rotate-90" />
                            </button>
                            {/* Dropdown */}
                            <div className="absolute top-full left-0 mt-1.5 w-56 bg-[#1A1A1A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden opacity-0 invisible group-hover/client:opacity-100 group-hover/client:visible transition-all duration-200 z-50">
                                <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
                                    {clients.map(c => (
                                        <button
                                            key={c.id}
                                            onClick={() => openClient(c.id)}
                                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                                                curClient === c.id
                                                    ? 'bg-white/10 text-white'
                                                    : 'text-white/60 hover:text-white hover:bg-white/5'
                                            }`}
                                        >
                                            <div
                                                className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[10px] font-black shrink-0 overflow-hidden"
                                                style={{ backgroundColor: c.color }}
                                            >
                                                {c.avatar ? (
                                                    <img src={c.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    c.name[0].toUpperCase()
                                                )}
                                            </div>
                                            <span className="truncate">{c.name}</span>
                                            {curClient === c.id && (
                                                <Check className="w-3 h-3 text-[#F7931E] ml-auto shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {/* Add new client inline */}
                                <div className="border-t border-white/5 p-2">
                                    <form
                                        onSubmit={e => {
                                            e.preventDefault();
                                            addClient();
                                        }}
                                        className="flex items-center gap-1.5"
                                    >
                                        <input
                                            value={newClientName}
                                            onChange={e => setNewClientName(e.target.value)}
                                            placeholder="Nuevo cliente..."
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-white/30 outline-none focus:border-[#F7931E]/60"
                                        />
                                        <button
                                            type="submit"
                                            className="bg-[#F7931E] text-white rounded-lg p-1.5 hover:bg-[#F7931E]/90 transition-all"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </div>

                        {/* Content Sub-tabs */}
                        <div className="hidden md:flex items-center gap-1 ml-2">
                            {([
                                ['calendar', 'Calendario', Calendar],
                                ['kanban', 'Kanban', KanbanIcon],
                                ['queue', 'Cola', ListOrdered],
                                ['tasks', 'Tareas', CheckSquare],
                                ['milestones', 'Hitos', Star]
                            ] as const).map(([key, label, Icon]) => (
                                <button
                                    key={key}
                                    onClick={() => setTab(key as any)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                                        tab === key
                                            ? 'bg-white/15 text-white shadow-sm'
                                            : 'text-white/40 hover:text-white/70'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5" /> {label}
                                </button>
                            ))}
                        </div>

                        {/* Year selector & controls (right) */}
                        <div className="hidden md:flex items-center gap-2 ml-auto">
                            {tab === 'calendar' && (
                                <>
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
                                </>
                            )}

                            {/* Share button */}
                            <button
                                onClick={handleCopy}
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                                    copied
                                        ? 'bg-green-500/20 border-green-500/40 text-green-400'
                                        : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                                }`}
                            >
                                {copied ? <Check className="w-3 h-3" /> : <Share2 className="w-3 h-3" />}
                                <span className="hidden xl:inline">{copied ? 'Copiado' : 'Compartir'}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Queue Context Bar (below header, when on global queue) ══ */}
            {mode === 'admin' && screen === 'queue' && suiteModule === 'content' && (
                <div className="sticky top-[57px] z-20 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/5">
                    <div className="max-w-screen-2xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={goHome}
                                className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs font-medium transition-all shrink-0"
                            >
                                <ArrowLeft className="w-3.5 h-3.5" />
                                <span>Volver al Inicio</span>
                            </button>
                            <span className="text-white/15 text-xs">·</span>
                            <span className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
                                <ListOrdered className="w-3.5 h-3.5 text-[#F7931E]" /> Cola Global de Producción
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Main Content Area with Animated Transitions ══ */}
            <main className="max-w-screen-2xl mx-auto px-4 md:px-8 py-6 flex-1 w-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${suiteModule}-${screen}-${curClient}-${tab}-${year}-${mon}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18 }}
                    >
                        {/* Módulos de Lumen Creativo Suite */}
                        {suiteModule === 'crm' ? (
                            <CrmView
                                leads={leads}
                                onAddLead={addLead}
                                onUpdateLead={updateLead}
                                onDeleteLead={deleteLead}
                                onConvertToClient={convertLeadToClient}
                            />
                        ) : suiteModule === 'metrics' ? (
                            <MetricsView
                                clients={clients}
                                metrics={metrics}
                                onSaveMetric={saveMetric}
                            />
                        ) : suiteModule === 'email' ? (
                            <EmailModulePlaceholder />
                        ) : screen === 'home' ? (
                            <HomeView
                                clients={clients}
                                tasks={tasks}
                                year={year}
                                setYear={setYear}
                                buildItems={buildItems}
                                onOpenClient={openClient}
                                onUpdateClientAvatar={updateClientAvatar}
                                onDeleteClient={deleteClient}
                                onGoToQueue={() => {
                                    setSuiteModule('content');
                                    setScreen('queue');
                                    setDlgDate(null);
                                    setFichaItem(null);
                                }}
                                onAddClient={addClient}
                                mode={mode}
                            />
                        ) : screen === 'queue' ? (
                            <ProductionQueue
                                allClientsItems={allClientsItems}
                                clients={clients}
                                mode={mode}
                                fixedClientId={null}
                                onUpdateStatus={(id, status, isRule) => updateItem(id, { status }, isRule)}
                                onOpenCard={item => {
                                    if (item.client_id !== curClient) {
                                        setCurClient(item.client_id);
                                    }
                                    setDlgDate(item.date);
                                    setFichaItem(item);
                                }}
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
                                onOpenCard={item => {
                                    setDlgDate(item.date);
                                    setFichaItem(item);
                                }}
                            />
                        ) : tab === 'queue' ? (
                            <ProductionQueue
                                allClientsItems={allClientsItems}
                                clients={clients}
                                mode={mode}
                                fixedClientId={curClient}
                                onUpdateStatus={(id, status, isRule) => updateItem(id, { status }, isRule)}
                                onOpenCard={item => {
                                    if (item.client_id !== curClient) {
                                        setCurClient(item.client_id);
                                    }
                                    setDlgDate(item.date);
                                    setFichaItem(item);
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
                    <>
                        <button
                            onClick={() => {
                                setSuiteModule('content');
                                goHome();
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                suiteModule === 'content' && screen === 'home' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <span className="text-base leading-none">⌂</span>
                            <span>Inicio</span>
                        </button>
                        <button
                            onClick={() => {
                                setSuiteModule('content');
                                setScreen('queue');
                                setDlgDate(null);
                                setFichaItem(null);
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                suiteModule === 'content' && screen === 'queue' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <ListOrdered className="w-4 h-4" />
                            <span>Cola</span>
                        </button>
                        <button
                            onClick={() => setSuiteModule('crm')}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                suiteModule === 'crm' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <Users className="w-4 h-4" />
                            <span>CRM</span>
                        </button>
                        <button
                            onClick={() => setSuiteModule('metrics')}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                suiteModule === 'metrics' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <BarChart3 className="w-4 h-4" />
                            <span>Métricas</span>
                        </button>
                    </>
                )}

                {curClient && suiteModule === 'content' && (
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
                                setTab('queue');
                            }}
                            className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
                                (screen === 'calendar' && tab === 'queue') || screen === 'queue' ? 'text-[#F7931E]' : 'text-white/40 hover:text-white'
                            }`}
                        >
                            <ListOrdered className="w-4 h-4" />
                            <span>Cola</span>
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

            {/* Global Day Dialog & Ficha View (Accessible from Month, Kanban, Tasks, Queue & Search) */}
            {dlgDate && (
                <DayDialog
                    mode={mode}
                    date={dlgDate}
                    items={(curClient ? buildItems(curClient, Number(dlgDate.split('-')[0])) : allClientsItems).filter(i => i.date === dlgDate)}
                    milestones={curClient ? milestoneOn(curClient, dlgDate) : []}
                    fichaItem={fichaItem}
                    setFichaItem={setFichaItem}
                    onClose={() => {
                        setDlgDate(null);
                        setFichaItem(null);
                    }}
                    onAdd={addItem}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                />
            )}

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
                suiteModule={suiteModule}
                onSelectModule={setSuiteModule}
                onGoHome={goHome}
                onGoQueue={() => {
                    setSuiteModule('content');
                    setScreen('queue');
                    setDlgDate(null);
                    setFichaItem(null);
                }}
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
