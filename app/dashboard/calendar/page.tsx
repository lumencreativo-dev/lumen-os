"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, ChevronRight, Plus, X, Calendar as CalIcon,
    Instagram, Facebook, Linkedin, Video, Image as ImageIcon,
    Layers, LayoutList, Kanban, Table as TableIcon, CheckCircle,
    Loader2, Trash2, Save, ExternalLink
} from "lucide-react";
import { clientService } from "@/lib/clients";
import { createClient } from "@/utils/supabase/client";
import { Client } from "@/types/clients";
import { ContentGridItem, Platform, ContentType, GridStatus } from "@/types/content-grid";
import ContentCreatorModal from "@/components/dashboard/calendar/ContentCreatorModal";

export default function PlannerPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedClient, setSelectedClient] = useState<string>("");
    const [clients, setClients] = useState<Client[]>([]);
    const [gridItems, setGridItems] = useState<ContentGridItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'calendar' | 'list' | 'kanban'>('calendar');

    // Modal & editing
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<ContentGridItem | null>(null);
    const [newItem, setNewItem] = useState<Partial<ContentGridItem>>({
        type: 'post',
        platforms: ['instagram'],
        status: 'draft'
    });

    useEffect(() => {
        // Load clients initially
        const loadClients = async () => {
            const allClients = await clientService.getAll();
            setClients(allClients);
            if (allClients.length > 0) {
                setSelectedClient(allClients[0].id);
            }
        };
        loadClients();
    }, []);

    useEffect(() => {
        if (selectedClient) {
            fetchItems();
        }
    }, [selectedClient]);

    const fetchItems = async () => {
        setIsLoading(true);
        if (!selectedClient) {
            setIsLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { data, error } = await supabase
                .from('CalendarEvent')
                .select('*')
                .eq('clientId', selectedClient);
            
            if (error) throw error;
            
            const mappedItems = (data || []).map(item => ({
                id: item.id,
                clientId: item.clientId,
                title: item.title,
                concept: item.title,
                content: item.type,
                type: item.type.includes('VIDEO') || item.type.includes('REEL') ? 'video' : 'post',
                platforms: ['instagram'],
                status: item.status.toLowerCase() === 'publicado' ? 'published' : (item.status.toLowerCase() === 'aprobado' ? 'approved' : 'draft'),
                scheduledDate: item.date,
                date: item.date
            }));
            
            setGridItems(mappedItems as any[]);
        } catch (error) {
            console.error("Error fetching items:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (itemData: any) => {
        if (!selectedClient) {
            alert("No hay cliente seleccionado");
            return;
        }

        try {
            const supabase = createClient();
            const payload = {
                clientId: selectedClient,
                title: itemData.concept || itemData.title || "Nuevo Evento",
                date: itemData.date || itemData.scheduledDate ? new Date(itemData.date || itemData.scheduledDate).toISOString() : new Date().toISOString(),
                type: itemData.type === 'video' ? 'REEL' : 'POST IG',
                status: itemData.status === 'published' ? 'PUBLICADO' : (itemData.status === 'approved' ? 'APROBADO' : 'BORRADOR'),
                layer: "CONTENT"
            };

            if (editingItem && editingItem.id) {
                const { error } = await supabase.from('CalendarEvent').update(payload).eq('id', editingItem.id);
                if (!error) {
                    setShowModal(false);
                    fetchItems();
                } else {
                    console.error("Update error:", error);
                    alert("Error al actualizar evento: " + error.message);
                }
            } else {
                const { error } = await supabase.from('CalendarEvent').insert(payload);
                if (!error) {
                    setShowModal(false);
                    fetchItems();
                } else {
                    console.error("Insert error:", error);
                    alert("Error al insertar evento: " + error.message);
                }
            }
        } catch (e) {
            console.error(e);
            alert("Error de conexión al guardar");
        }
    };

    const handleDelete = async () => {
        if (!editingItem || !editingItem.id) return;
        if (!confirm("¿Eliminar este evento?")) return;

        try {
            const supabase = createClient();
            const { error } = await supabase.from('CalendarEvent').delete().eq('id', editingItem.id);
            if (!error) {
                setShowModal(false);
                fetchItems();
            } else {
                console.error("Delete error:", error);
                alert("Error al eliminar evento");
            }
        } catch (e) {
            console.error("Failed to delete", e);
        }
    };

    const handleOpenCreate = (dateStr?: string) => {
        setEditingItem(null);
        setNewItem({
            date: dateStr || new Date().toISOString().split('T')[0],
            type: 'post',
            platforms: ['instagram'],
            status: 'draft',
            concept: "",
            caption: ""
        });
        setShowModal(true);
    };

    const handleOpenEdit = (item: ContentGridItem) => {
        setEditingItem(item);
        setNewItem({ ...item });
        setShowModal(true);
    };

    // --- Sub-Components Renders ---

    const renderCalendar = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 Sun
        const startOffset = firstDay === 0 ? 6 : firstDay - 1;

        const days = [];
        for (let i = 0; i < startOffset; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

        return (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 overflow-hidden flex flex-col h-full">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-6 bg-white border-b border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="rounded-full w-8 h-8 hover:bg-lumen-clarity border-gray-200">
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="rounded-full w-8 h-8 hover:bg-lumen-clarity border-gray-200">
                                <ChevronRight className="w-4 h-4 text-gray-600" />
                            </Button>
                        </div>
                        <h2 className="text-3xl font-bold capitalize text-gray-900 tracking-wide">
                            {currentDate.toLocaleString('es-ES', { month: 'long' })} <span className="text-gray-300 text-xl">{year}</span>
                        </h2>
                    </div>
                    <Button onClick={() => handleOpenCreate()} className="bg-lumen-priority text-white hover:bg-orange-500 transition-all rounded-full px-6 shadow-lg shadow-amber-400/30">
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Contenido
                    </Button>
                </div>

                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/50">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                        <div key={d} className="py-3 text-center text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest font-sans">
                            {d}
                        </div>
                    ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(140px,1fr)] divide-x divide-gray-100 divide-y bg-gray-50/10">
                    {days.map((d, i) => {
                        if (!d) return <div key={i} className="bg-gray-50/30" />;

                        const dateStr = d.toISOString().split('T')[0];
                        const isToday = dateStr === new Date().toISOString().split('T')[0];
                        const items = gridItems.filter(x => { const d = ((x as any).date || (x as any).scheduledDate || '').split('T')[0]; return d === dateStr; });

                        return (
                            <div
                                key={i}
                                onClick={() => handleOpenCreate(dateStr)}
                                className={`group relative p-2 transition-all hover:bg-blue-50/20 cursor-pointer flex flex-col gap-2 ${isToday ? 'bg-orange-50 ring-2 ring-inset ring-lumen-priority/30' : ''}`}
                            >
                                {/* Date Number */}
                                <div className="flex justify-between items-start">
                                    <span className={`text-sm font-medium w-8 h-8 flex items-center justify-center rounded-full transition-colors
                                        ${isToday ? 'bg-lumen-priority text-white shadow-md shadow-amber-200 font-bold' : 'text-gray-400 group-hover:text-gray-900 bg-transparent group-hover:bg-white'}
                                    `}>
                                        {d.getDate()}
                                    </span>
                                    {items.length > 0 && (
                                        <span className="text-[10px] font-bold text-gray-300 bg-gray-50 px-1.5 rounded-full">{items.length}</span>
                                    )}
                                </div>

                                {/* Items Container */}
                                <div className="flex-1 space-y-1.5 overflow-y-auto custom-scrollbar">
                                    {items.map(item => (
                                        <div
                                            key={item.id}
                                            onClick={(e) => { e.stopPropagation(); handleOpenEdit(item); }}
                                            className={`
                                                relative overflow-hidden rounded-lg p-2 border transition-all hover:-translate-y-0.5 hover:shadow-md
                                                ${item.status === 'approved' ? 'bg-green-50/80 border-green-100 text-green-900' :
                                                    item.status === 'pending_approval' ? 'bg-amber-50/80 border-amber-100 text-amber-900 dashed-border' :
                                                        item.status === 'published' ? 'bg-gray-900 text-white border-gray-800' :
                                                            'bg-orange-50 border-orange-200 text-orange-900'
                                                }
                                            `}
                                        >
                                            {/* Status Indicator Line */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 
                                                ${item.status === 'approved' ? 'bg-green-500' :
                                                    item.status === 'pending_approval' ? 'bg-amber-400' :
                                                        item.status === 'published' ? 'bg-gray-700' : 'bg-gray-300'}
                                            `} />

                                            <div className="pl-2 flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 text-[10px] opacity-70 uppercase tracking-wider font-bold">
                                                    {item.type === 'reel' ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                                    {item.platforms?.[0] || 'IG'}
                                                </div>
                                                <span className="text-xs font-medium truncate leading-tight">{item.concept}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Add Button on Hover */}
                                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 hover:bg-lumen-priority hover:text-white flex items-center justify-center text-gray-400 transition-colors">
                                        <Plus className="w-3 h-3" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderList = () => (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium">
                    <tr>
                        <th className="px-6 py-3">Fecha</th>
                        <th className="px-6 py-3">Concepto</th>
                        <th className="px-6 py-3">Plataformas</th>
                        <th className="px-6 py-3">Estado</th>
                        <th className="px-6 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {gridItems.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(item => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">{item.date}</td>
                            <td className="px-6 py-4 font-medium flex items-center gap-2">
                                {item.type === 'reel' ? <Video className="w-4 h-4 text-purple-500" /> : <ImageIcon className="w-4 h-4 text-blue-500" />}
                                {item.concept}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-1">
                                    {(item.platforms || []).map(p => (
                                        <span key={p} className="text-[10px] uppercase bg-gray-100 px-1 rounded">{p}</span>
                                    ))}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.status === 'approved' ? 'bg-green-100 text-green-700' :
                                    item.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-700' :
                                        item.status === 'published' ? 'bg-gray-800 text-white' :
                                            'bg-orange-100 text-orange-700'
                                    }`}>
                                    {item.status === 'pending_approval' ? 'Pendiente' :
                                        item.status === 'approved' ? 'Aprobado' :
                                            item.status === 'published' ? 'Publicado' : 'Borrador'}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(item)}>Editar</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderKanban = () => {
        const columns: { id: GridStatus, label: string, color: string }[] = [
            { id: 'draft', label: 'Borrador / Ideas', color: 'bg-gray-100' },
            { id: 'pending_approval', label: 'Por Aprobar', color: 'bg-yellow-50' },
            { id: 'approved', label: 'Aprobado', color: 'bg-green-50' },
        ];

        return (
            <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-200px)]">
                {columns.map(col => (
                    <div key={col.id} className="min-w-[300px] w-1/3 flex flex-col bg-gray-50/50 rounded-xl border border-gray-200">
                        <div className={`p-4 font-bold border-b border-gray-200 rounded-t-xl flex justify-between items-center ${col.color}`}>
                            {col.label}
                            <span className="text-xs bg-white px-2 py-0.5 rounded-full shadow-sm">
                                {gridItems.filter(i => i.status === col.id).length}
                            </span>
                        </div>
                        <div className="p-3 space-y-3 flex-1 overflow-y-auto">
                            {gridItems.filter(i => i.status === col.id).map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => handleOpenEdit(item)}
                                    className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                                            {item.type === 'reel' ? <Video className="w-3 h-3 text-purple-500" /> : <ImageIcon className="w-3 h-3 text-blue-500" />}
                                            <span className="uppercase">{item.type}</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{item.date}</span>
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm mb-2">{item.concept}</h4>
                                    <div className="flex gap-1 mb-2">
                                        {(item.platforms || []).map(p => (
                                            <div key={p} className={`w-2 h-2 rounded-full ${p === 'instagram' ? 'bg-pink-500' : p === 'facebook' ? 'bg-blue-600' : 'bg-blue-800'
                                                }`} />
                                        ))}
                                    </div>
                                    <div className="pt-2 border-t border-gray-100 flex justify-between items-center">
                                        <span className="text-xs text-gray-400 truncate max-w-[150px]">{item.caption || "Sin caption"}</span>
                                    </div>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-gray-400 hover:text-gray-600 text-sm border border-dashed border-gray-200" onClick={() => handleOpenCreate()}>
                                <Plus className="w-4 h-4 mr-2" /> Añadir
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
                <div>
                    <h1 className="lumen-title text-4xl font-black text-gray-900 tracking-tight">
                        Planificador Editorial
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona el contenido de tus clientes conectados a Lumen OS.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    <select
                        className="p-2 bg-transparent text-sm font-medium outline-none"
                        value={selectedClient}
                        onChange={(e) => setSelectedClient(e.target.value)}
                    >
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <div className="h-6 w-px bg-gray-200" />
                    <div className="flex gap-1">
                        <Button
                            variant={view === 'calendar' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('calendar')}
                            className={view === 'calendar' ? 'bg-gray-100' : ''}
                        >
                            <CalIcon className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={view === 'kanban' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('kanban')}
                            className={view === 'kanban' ? 'bg-gray-100' : ''}
                        >
                            <Kanban className="w-4 h-4" />
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="sm"
                            onClick={() => setView('list')}
                            className={view === 'list' ? 'bg-gray-100' : ''}
                        >
                            <TableIcon className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0">
                {isLoading ? (
                    <div className="h-64 flex items-center justify-center text-gray-400 animate-pulse">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando tareas de ERPNext...
                    </div>
                ) : (
                    <>
                        {view === 'calendar' && renderCalendar()}
                        {view === 'list' && renderList()}
                        {view === 'kanban' && renderKanban()}
                    </>
                )}
            </div>

            {/* Edit/Create Modal (Simplified Reuse) */}
            {/* Edit/Create Modal */}
            <ContentCreatorModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                onDelete={handleDelete}
                initialData={newItem}
                isEditing={!!editingItem}
            />
        </div>
    );
}
