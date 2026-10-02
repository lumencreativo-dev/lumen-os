"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Plus, Link as LinkIcon, ExternalLink, MessageCircle, FileVideo,
    Image as ImageIcon, FileText, Loader2, Check, Layout, Layers, X,
    Upload, Clock, Filter, Search, Eye, History, Calendar, RefreshCw
} from "lucide-react";
import { deliverableService } from "@/lib/deliverables";
import { clientService } from "@/lib/clients";
import { Deliverable, DeliverableType, DeliverablePriority } from "@/types/deliverables";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { ApprovalStats } from "@/components/portal/ApprovalStats";
import { VersionBadge, DeadlineIndicator, PriorityBadge, VersionHistory } from "@/components/portal/VersionHistory";
import { Skeleton, SkeletonTableRow } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { motion, AnimatePresence } from "framer-motion";

type FilterStatus = 'all' | 'pending' | 'approved' | 'changes_requested' | 'in_revision';

export default function DeliverablesPage() {
    const { user } = useAuth();
    const [items, setItems] = useState<Deliverable[]>([]);
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [showForm, setShowForm] = useState(false);

    // Filters
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
    const [clientFilter, setClientFilter] = useState<string>('all');

    // Detail Panel
    const [selectedItem, setSelectedItem] = useState<Deliverable | null>(null);
    const [showDetailPanel, setShowDetailPanel] = useState(false);

    // New Item Form State
    const [newItem, setNewItem] = useState({
        title: "",
        clientName: "",
        clientId: "",
        type: "image" as DeliverableType,
        url: "",
        carouselSlides: ["", ""],
        description: "",
        deadline: "",
        priority: "normal" as DeliverablePriority
    });

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        setIsLoading(true);
        try {
            const [deliverablesData, clientsData] = await Promise.all([
                deliverableService.getAll(),
                clientService.getAll()
            ]);
            // Add default currentVersion if missing
            const itemsWithDefaults = deliverablesData.map(d => ({
                ...d,
                currentVersion: d.currentVersion || 1
            }));
            setItems(itemsWithDefaults);
            setClients(clientsData);
        } catch (error) {
            console.error("Failed to load data", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Filtered items
    const filteredItems = useMemo(() => {
        let result = items;

        // Search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.title.toLowerCase().includes(query) ||
                item.clientName.toLowerCase().includes(query)
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter(item => item.status === statusFilter);
        }

        // Client filter
        if (clientFilter !== 'all') {
            result = result.filter(item => item.clientId === clientFilter);
        }

        return result;
    }, [items, searchQuery, statusFilter, clientFilter]);

    const handleCreate = async () => {
        const primaryUrl = newItem.type === 'carousel' ? newItem.carouselSlides[0] : newItem.url;

        if (!newItem.title || !primaryUrl) {
            alert("Título y URL principal son obligatorios");
            return;
        }

        if (!newItem.clientId) {
            alert("Debes seleccionar un cliente");
            return;
        }

        setIsCreating(true);

        const deliverable: Deliverable = {
            id: "",
            title: newItem.title,
            clientName: newItem.clientName || "Cliente General",
            clientId: newItem.clientId,
            type: newItem.type,
            url: primaryUrl,
            carouselUrls: newItem.type === 'carousel' ? newItem.carouselSlides.slice(1).filter(u => u.trim() !== "") : undefined,
            status: "pending",
            createdAt: new Date().toISOString(),
            description: newItem.description,
            currentVersion: 1,
            deadline: newItem.deadline || undefined,
            priority: newItem.priority,
            versions: [{
                version: 1,
                url: primaryUrl,
                carouselUrls: newItem.type === 'carousel' ? newItem.carouselSlides.slice(1).filter(u => u.trim() !== "") : undefined,
                createdAt: new Date().toISOString(),
                createdBy: user?.name || 'Sistema'
            }]
        };

        const newId = await deliverableService.add(deliverable);

        if (newId) {
            loadItems();
            setIsCreating(false);
            setShowForm(false);

            setNewItem({
                title: "", clientName: "", clientId: "",
                type: "image", url: "", carouselSlides: ["", ""], description: "",
                deadline: "", priority: "normal"
            });

            const selectedClient = clients.find(c => c.id === deliverable.clientId);
            alert(`✅ ¡Entregable asignado correctamente!\n\nYa está visible en el portal de ${selectedClient?.name || 'Cliente'}.`);
        } else {
            alert("Error al guardar. Revisa la consola.");
            setIsCreating(false);
        }
    };

    const copyLink = (id: string) => {
        const link = `${window.location.origin}/review/${id}`;
        navigator.clipboard.writeText(link);
        alert("Link copiado al portapapeles: " + link);
    };

    const getTypeIcon = (type: DeliverableType) => {
        switch (type) {
            case 'video': return <FileVideo className="w-5 h-5 text-blue-500" />;
            case 'image': return <ImageIcon className="w-5 h-5 text-purple-500" />;
            case 'carousel': return <Layers className="w-5 h-5 text-pink-500" />;
            default: return <FileText className="w-5 h-5 text-gray-500" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'approved':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1"><Check className="w-3 h-3" /> Aprobado</span>;
            case 'changes_requested':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1"><MessageCircle className="w-3 h-3" /> Cambios</span>;
            case 'in_revision':
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 flex items-center gap-1"><Upload className="w-3 h-3" /> En Revisión</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1"><Clock className="w-3 h-3" /> Pendiente</span>;
        }
    };

    const updateCarouselSlide = (index: number, value: string) => {
        const slides = [...newItem.carouselSlides];
        slides[index] = value;
        setNewItem({ ...newItem, carouselSlides: slides });
    };

    const addCarouselSlide = () => {
        setNewItem({ ...newItem, carouselSlides: [...newItem.carouselSlides, ""] });
    };

    const openDetailPanel = (item: Deliverable) => {
        setSelectedItem(item);
        setShowDetailPanel(true);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="lumen-title text-4xl font-black text-gray-900 tracking-tight">
                        Aprobaciones
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Gestiona los entregables visibles en el portal del cliente.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={loadItems}
                        className="lumen-btn lumen-btn-ghost text-gray-500"
                        title="Refrescar"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="lumen-btn lumen-btn-primary"
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Entregable
                    </button>
                </div>
            </div>

            {/* Stats */}
            <ApprovalStats deliverables={items} />

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por título o cliente..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority shadow-sm transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as FilterStatus)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20"
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendientes</option>
                    <option value="approved">Aprobados</option>
                    <option value="changes_requested">Cambios Solicitados</option>
                    <option value="in_revision">En Revisión</option>
                </select>
                <select
                    value={clientFilter}
                    onChange={e => setClientFilter(e.target.value)}
                    className="px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20"
                >
                    <option value="all">Todos los clientes</option>
                    {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3">Entregable</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Versión</th>
                                <th className="px-6 py-3">Deadline</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <>
                                    <tr><td colSpan={6}><SkeletonTableRow /></td></tr>
                                    <tr><td colSpan={6}><SkeletonTableRow /></td></tr>
                                    <tr><td colSpan={6}><SkeletonTableRow /></td></tr>
                                </>
                            ) : filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyState
                                            title="Sin entregables"
                                            description={searchQuery || statusFilter !== 'all'
                                                ? "No hay entregables que coincidan con tus filtros"
                                                : "Crea tu primer entregable para comenzar"
                                            }
                                            actionLabel={!searchQuery && statusFilter === 'all' ? "Crear Entregable" : undefined}
                                            onAction={!searchQuery && statusFilter === 'all' ? () => setShowForm(true) : undefined}
                                        />
                                    </td>
                                </tr>
                            ) : filteredItems.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => openDetailPanel(item)}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-lg">
                                                {getTypeIcon(item.type)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{item.title}</p>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</span>
                                                    {item.type === 'carousel' && (
                                                        <span className="text-xs bg-pink-50 text-pink-600 px-1.5 rounded border border-pink-100">Carrusel</span>
                                                    )}
                                                    {item.priority && item.priority !== 'normal' && (
                                                        <PriorityBadge priority={item.priority} />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {item.status === 'changes_requested' && item.feedback && item.feedback.length > 0 && (
                                            <div className="mt-2 text-xs bg-red-50 text-red-600 p-2 rounded border border-red-100 max-w-xs">
                                                <strong>Feedback:</strong> "{item.feedback[item.feedback.length - 1].comment}"
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{item.clientName}</td>
                                    <td className="px-6 py-4">
                                        <VersionBadge version={item.currentVersion} isLatest />
                                    </td>
                                    <td className="px-6 py-4">
                                        {item.deadline ? (
                                            <DeadlineIndicator deadline={item.deadline} />
                                        ) : (
                                            <span className="text-xs text-gray-400">Sin fecha</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                                    <td className="px-6 py-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" onClick={() => openDetailPanel(item)} title="Ver Historial">
                                            <History className="w-4 h-4 text-gray-400" />
                                        </Button>
                                        <Link href={`/review/${item.id}`} target="_blank">
                                            <Button variant="ghost" size="sm" title="Ver Link Individual">
                                                <ExternalLink className="w-4 h-4 text-gray-400" />
                                            </Button>
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Creation Form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-lumen-priority" />
                                    Asignar Nuevo Entregable al Portal
                                </h3>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4 md:col-span-2">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                                            <select
                                                className="p-2.5 rounded-lg border border-gray-300 w-full bg-white text-sm"
                                                value={newItem.clientId}
                                                onChange={e => {
                                                    const selectedClient = clients.find(c => c.id === e.target.value);
                                                    if (selectedClient) {
                                                        setNewItem({ ...newItem, clientName: selectedClient.name, clientId: selectedClient.id });
                                                    } else {
                                                        setNewItem({ ...newItem, clientName: "", clientId: "" });
                                                    }
                                                }}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {clients.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                            <select
                                                className="p-2.5 rounded-lg border border-gray-300 w-full bg-white text-sm"
                                                value={newItem.type}
                                                onChange={e => setNewItem({ ...newItem, type: e.target.value as DeliverableType })}
                                            >
                                                <option value="image">Imagen</option>
                                                <option value="video">Video</option>
                                                <option value="carousel">Carrusel</option>
                                                <option value="link">Enlace</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                                            <select
                                                className="p-2.5 rounded-lg border border-gray-300 w-full bg-white text-sm"
                                                value={newItem.priority}
                                                onChange={e => setNewItem({ ...newItem, priority: e.target.value as DeliverablePriority })}
                                            >
                                                <option value="low">Baja</option>
                                                <option value="normal">Normal</option>
                                                <option value="high">Alta</option>
                                                <option value="urgent">Urgente</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                                            <input
                                                type="date"
                                                className="p-2.5 rounded-lg border border-gray-300 w-full text-sm"
                                                value={newItem.deadline}
                                                onChange={e => setNewItem({ ...newItem, deadline: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                                    <input
                                        type="text"
                                        placeholder="Ej. Reel de Lanzamiento - Semana Santa"
                                        className="p-2.5 rounded-lg border border-gray-300 w-full text-sm"
                                        value={newItem.title}
                                        onChange={e => setNewItem({ ...newItem, title: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    {newItem.type === 'carousel' ? (
                                        <div className="space-y-3 bg-white p-4 rounded-lg border border-gray-200">
                                            <label className="block text-sm font-medium text-gray-700">Imágenes del Carrusel</label>
                                            {newItem.carouselSlides.map((slide, idx) => (
                                                <div key={idx} className="flex gap-2">
                                                    <span className="text-sm text-gray-500 py-2.5 w-6">{idx + 1}.</span>
                                                    <input
                                                        type="text"
                                                        placeholder={`URL de la imagen ${idx + 1}`}
                                                        className="flex-1 p-2.5 rounded-lg border border-gray-300 text-sm"
                                                        value={slide}
                                                        onChange={e => updateCarouselSlide(idx, e.target.value)}
                                                    />
                                                    {idx > 1 && (
                                                        <Button variant="ghost" size="icon" onClick={() => {
                                                            const newSlides = newItem.carouselSlides.filter((_, i) => i !== idx);
                                                            setNewItem({ ...newItem, carouselSlides: newSlides });
                                                        }}>
                                                            <X className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                            <Button variant="outline" size="sm" onClick={addCarouselSlide} className="mt-2">
                                                <Plus className="w-3 h-3 mr-1" /> Agregar Slide
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">URL del Contenido *</label>
                                            <input
                                                type="text"
                                                placeholder={newItem.type === 'video' ? "https://youtube.com/..." : "https://..."}
                                                className="p-2.5 rounded-lg border border-gray-300 w-full text-sm"
                                                value={newItem.url}
                                                onChange={e => setNewItem({ ...newItem, url: e.target.value })}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Mensaje</label>
                                    <textarea
                                        placeholder="Notas para el cliente sobre esta entrega..."
                                        className="p-2.5 rounded-lg border border-gray-300 w-full text-sm h-24"
                                        value={newItem.description}
                                        onChange={e => setNewItem({ ...newItem, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-2">
                                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
                                <Button onClick={handleCreate} disabled={isCreating} className="bg-lumen-priority text-white px-8">
                                    {isCreating ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : <Layout className="w-4 h-4 mr-2" />}
                                    {isCreating ? "Guardando..." : "Asignar a Portal"}
                                </Button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Detail Panel (Slide Over) */}
            <AnimatePresence>
                {showDetailPanel && selectedItem && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                            onClick={() => setShowDetailPanel(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
                        >
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900">{selectedItem.title}</h3>
                                    <p className="text-sm text-gray-500">{selectedItem.clientName}</p>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setShowDetailPanel(false)}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Preview */}
                            <div className="p-4 border-b border-gray-100">
                                <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                                    {selectedItem.type === 'image' || selectedItem.type === 'carousel' ? (
                                        <img src={selectedItem.url} alt={selectedItem.title} className="w-full h-full object-contain" />
                                    ) : selectedItem.type === 'video' ? (
                                        <video src={selectedItem.url} controls className="w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white">
                                            <ExternalLink className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-3">
                                    {getStatusBadge(selectedItem.status)}
                                    <VersionBadge version={selectedItem.currentVersion} isLatest />
                                    {selectedItem.deadline && <DeadlineIndicator deadline={selectedItem.deadline} />}
                                </div>
                            </div>

                            {/* History */}
                            <div className="flex-1 overflow-y-auto p-4">
                                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Historial de Versiones
                                </h4>
                                <VersionHistory
                                    versions={selectedItem.versions || []}
                                    feedback={selectedItem.feedback || []}
                                    currentVersion={selectedItem.currentVersion}
                                />
                            </div>

                            {/* Actions */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50">
                                <div className="flex gap-2">
                                    <Button variant="outline" className="flex-1" onClick={() => copyLink(selectedItem.id)}>
                                        <LinkIcon className="w-4 h-4 mr-2" />
                                        Copiar Link
                                    </Button>
                                    <Link href={`/review/${selectedItem.id}`} target="_blank" className="flex-1">
                                        <Button className="w-full bg-lumen-priority">
                                            <Eye className="w-4 h-4 mr-2" />
                                            Ver como Cliente
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
