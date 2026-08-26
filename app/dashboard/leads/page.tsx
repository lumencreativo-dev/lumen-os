"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import KanbanBoard from "@/components/crm/KanbanBoard";
import { LeadSlideOver } from "@/components/crm/LeadSlideOver";
import { PipelineSelector } from "@/components/crm/PipelineSelector";
import { PipelineManager } from "@/components/crm/PipelineManager";
import { LeadFilters, LeadFiltersState, initialFilters } from "@/components/crm/LeadFilters";
import { ConversionMetrics } from "@/components/crm/ConversionMetrics";
import { Lead } from "@/types/crm";
import { Pipeline, DEFAULT_PIPELINES } from "@/types/pipelines";
import { Button } from "@/components/ui/button";
import { SkeletonTableRow, SkeletonMetricCard } from "@/components/ui/skeleton";
import { EmptyLeads, EmptySearchResults } from "@/components/ui/empty-state";
import { LayoutList, Kanban, Calendar, Table as TableIcon, Plus, Loader2, Phone, Mail, Clock, RefreshCw } from "lucide-react";

const PIPELINES_STORAGE_KEY = 'lumen_pipelines_v1';
const ACTIVE_PIPELINE_KEY = 'lumen_active_pipeline';

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [events, setEvents] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
    const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);

    // Pipeline State
    const [pipelines, setPipelines] = useState<Pipeline[]>([]);
    const [activePipelineId, setActivePipelineId] = useState<string>('prospectos');
    const [isPipelineManagerOpen, setIsPipelineManagerOpen] = useState(false);

    // Filters State
    const [filters, setFilters] = useState<LeadFiltersState>(initialFilters);

    // View Switcher
    const [view, setView] = useState<'kanban' | 'list' | 'calendar'>('kanban');

    // Calendar State
    const [currentDate, setCurrentDate] = useState(new Date());

    // Load pipelines from storage
    useEffect(() => {
        const stored = localStorage.getItem(PIPELINES_STORAGE_KEY);
        if (stored) {
            try {
                setPipelines(JSON.parse(stored));
            } catch {
                setPipelines(DEFAULT_PIPELINES);
            }
        } else {
            setPipelines(DEFAULT_PIPELINES);
        }

        const activeId = localStorage.getItem(ACTIVE_PIPELINE_KEY);
        if (activeId) {
            setActivePipelineId(activeId);
        }
    }, []);

    // Save pipelines to storage
    const handleSavePipelines = (newPipelines: Pipeline[]) => {
        setPipelines(newPipelines);
        localStorage.setItem(PIPELINES_STORAGE_KEY, JSON.stringify(newPipelines));
    };

    // Change active pipeline
    const handleSelectPipeline = (id: string) => {
        setActivePipelineId(id);
        localStorage.setItem(ACTIVE_PIPELINE_KEY, id);
    };

    const activePipeline = pipelines.find(p => p.id === activePipelineId) || pipelines[0];

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            // 1. Fetch Leads
            const resLeads = await fetch("/api/leads");
            if (resLeads.ok) {
                const data = await resLeads.json();
                // Assign leads to default pipeline/column if not set
                const leadsWithDefaults = (data.leads || []).map((lead: Lead) => ({
                    ...lead,
                    pipelineId: lead.pipelineId || 'prospectos',
                    columnId: lead.columnId || 'nuevo'
                }));
                setLeads(leadsWithDefaults);
            }

            // 2. Events (TODO: implement with Prisma)
            setEvents([]);
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter leads
    const filteredLeads = useMemo(() => {
        let result = leads.filter(l => l.pipelineId === activePipelineId || (!l.pipelineId && activePipelineId === 'prospectos'));

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(l =>
                l.lead_name?.toLowerCase().includes(searchLower) ||
                l.email_id?.toLowerCase().includes(searchLower) ||
                l.title?.toLowerCase().includes(searchLower)
            );
        }

        // Source filter
        if (filters.source) {
            result = result.filter(l => l.source === filters.source);
        }

        // Assigned filter
        if (filters.assignedTo) {
            result = result.filter(l => l.assignedTo === filters.assignedTo);
        }

        // Date range filter
        if (filters.dateRange.from) {
            result = result.filter(l => {
                const leadDate = l.createdAt || l.creation;
                return leadDate && leadDate >= filters.dateRange.from!;
            });
        }
        if (filters.dateRange.to) {
            result = result.filter(l => {
                const leadDate = l.createdAt || l.creation;
                return leadDate && leadDate <= filters.dateRange.to!;
            });
        }

        // Value range filter
        if (filters.valueRange.min !== null) {
            result = result.filter(l => (l.value || 0) >= filters.valueRange.min!);
        }
        if (filters.valueRange.max !== null) {
            result = result.filter(l => (l.value || 0) <= filters.valueRange.max!);
        }

        // Tags filter
        if (filters.tags.length > 0) {
            result = result.filter(l =>
                filters.tags.some(tag => l.tags?.includes(tag))
            );
        }

        return result;
    }, [leads, activePipelineId, filters]);

    const handleLeadUpdate = (updatedLead: Lead) => {
        setLeads(prev => prev.map(lead =>
            lead.name === updatedLead.name ? updatedLead : lead
        ));
    };

    const handleLeadClick = (id: string) => {
        setSelectedLeadId(id);
        setIsSlideOverOpen(true);
    };

    const handleSlideOverClose = () => {
        setIsSlideOverOpen(false);
        setSelectedLeadId(null);
    };

    const handleAddLead = () => {
        // TODO: Open create lead modal
        console.log("Add new lead");
    };

    // --- Sub Views ---

    const renderList = () => {
        if (isLoading) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {[1, 2, 3, 4, 5].map(i => <SkeletonTableRow key={i} />)}
                </div>
            );
        }

        if (filteredLeads.length === 0) {
            return (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">
                    {filters.search || filters.source || filters.assignedTo ? (
                        <EmptySearchResults />
                    ) : (
                        <EmptyLeads onAction={handleAddLead} />
                    )}
                </div>
            );
        }

        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                            <th className="px-6 py-3">Nombre</th>
                            <th className="px-6 py-3">Organización</th>
                            <th className="px-6 py-3">Contacto</th>
                            <th className="px-6 py-3">Valor</th>
                            <th className="px-6 py-3">Estado</th>
                            <th className="px-6 py-3 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredLeads.map(lead => {
                            const column = activePipeline?.columns.find(c => c.id === lead.columnId);
                            return (
                                <tr key={lead.name} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleLeadClick(lead.name)}>
                                    <td className="px-6 py-4 font-bold text-gray-900">{lead.lead_name}</td>
                                    <td className="px-6 py-4">{lead.title || "-"}</td>
                                    <td className="px-6 py-4 text-gray-500">
                                        <div className="flex flex-col gap-1">
                                            {lead.email_id && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email_id}</span>}
                                            {lead.mobile_no && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.mobile_no}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {lead.value ? (
                                            <span className="font-medium text-green-600">${lead.value.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-gray-400">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold bg-${column?.color || 'gray'}-100 text-${column?.color || 'gray'}-700`}>
                                            {column?.name || lead.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="sm">Ver Detalles</Button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;
        const days = Array(startOffset).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)));

        const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
        const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

        return (
            <div className="flex flex-col h-full bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={prevMonth}>←</Button>
                        <h3 className="font-bold text-lg capitalize">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</h3>
                        <Button variant="ghost" size="sm" onClick={nextMonth}>→</Button>
                    </div>
                    <div className="text-xs text-gray-500">Eventos de ERPNext</div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-7 gap-1">
                        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => <div key={d} className="text-center text-xs font-bold text-gray-400 py-2">{d}</div>)}
                        {days.map((d, i) => {
                            if (!d) return <div key={i} className="" />;
                            const dateStr = d.toISOString().split('T')[0];
                            const dayEvents = events.filter(e => e.starts_on?.startsWith(dateStr));
                            const isToday = d.toDateString() === new Date().toDateString();

                            return (
                                <div key={i} className={`min-h-[100px] border border-gray-100 p-1 rounded hover:bg-gray-50 ${isToday ? 'bg-lumen-priority/5 border-lumen-priority/30' : ''}`}>
                                    <div className={`text-right text-xs mb-1 ${isToday ? 'text-lumen-priority font-bold' : 'text-gray-400'}`}>{d.getDate()}</div>
                                    <div className="space-y-1">
                                        {dayEvents.map(ev => (
                                            <div key={ev.name} className="bg-blue-50 text-blue-700 text-[10px] p-1 rounded truncate border border-blue-100" title={ev.subject}>
                                                {ev.subject}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col space-y-4">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            CRM
                            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
                        </h1>
                        <p className="text-gray-500 text-sm">Gestiona leads, prospectos y clientes.</p>
                    </div>

                    {/* Pipeline Selector */}
                    <PipelineSelector
                        pipelines={pipelines}
                        activePipelineId={activePipelineId}
                        onSelect={handleSelectPipeline}
                        onCreateNew={() => setIsPipelineManagerOpen(true)}
                        onManage={() => setIsPipelineManagerOpen(true)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    {/* View Switcher */}
                    <div className="bg-white p-1 rounded-xl border border-gray-200 shadow-sm flex gap-1">
                        <Button
                            variant={view === 'kanban' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('kanban')}
                            title="Kanban"
                        >
                            <Kanban className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('list')}
                            title="Lista"
                        >
                            <TableIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={view === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('calendar')}
                            title="Calendario"
                        >
                            <Calendar className="w-4 h-4" />
                        </Button>
                    </div>

                    <Button variant="ghost" size="icon" onClick={fetchData} title="Refrescar">
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button onClick={handleAddLead} className="bg-lumen-priority hover:bg-lumen-priority/90">
                        <Plus className="w-4 h-4 mr-1" />
                        Nuevo Lead
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            {activePipeline && (
                <ConversionMetrics leads={filteredLeads} pipeline={activePipeline} />
            )}

            {/* Filters */}
            <LeadFilters
                filters={filters}
                onChange={setFilters}
            />

            {/* Main Content */}
            <div className="flex-1 overflow-hidden">
                {view === 'kanban' && (
                    <KanbanBoard
                        leads={filteredLeads}
                        onLeadUpdate={handleLeadUpdate}
                        onLeadClick={handleLeadClick}
                        isLoading={isLoading}
                        pipeline={activePipeline}
                        onAddLead={handleAddLead}
                    />
                )}
                {view === 'list' && renderList()}
                {view === 'calendar' && renderCalendar()}
            </div>

            {/* Slide Over */}
            {selectedLeadId && (
                <LeadSlideOver
                    leadId={selectedLeadId}
                    isOpen={isSlideOverOpen}
                    onClose={handleSlideOverClose}
                />
            )}

            {/* Pipeline Manager Modal */}
            <PipelineManager
                isOpen={isPipelineManagerOpen}
                onClose={() => setIsPipelineManagerOpen(false)}
                pipelines={pipelines}
                onSave={handleSavePipelines}
            />
        </div>
    );
}
