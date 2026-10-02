"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Link as LinkIcon,
    ExternalLink,
    RefreshCw,
    Plus,
    Loader2,
    Instagram,
    Phone,
    Briefcase,
    X,
    Palette,
    Pencil,
    Trash2,
    Search,
    Users,
    AlertCircle,
    Copy,
    FileText,
    FolderOpen,
    MessageCircle,
    User,
    Building2,
    Lock,
    StickyNote,
    Eye,
    EyeOff,
    ChevronRight,
    MessageSquare,
    Globe,
    Calendar,
    LayoutDashboard,
} from "lucide-react";
import { Client, SocialCredential } from "@/types/clients";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type FormTab = 'info' | 'contact' | 'credentials' | 'notes';

export default function ClientsAdminPage() {
    const [clients, setClients] = useState<Client[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal & Form State
    const [showForm, setShowForm] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<FormTab>('info');
    const [formData, setFormData] = useState({
        name: "",
        instagram: "",
        industry: "",
        contactPhone: "",
        whatsapp: "",
        paymentDay: "",
            brandColor: "#000000",
            logoUrl: "",
        contactPerson: "",
        email: "",
        address: "",
        taxId: "",
        website: "",
        notes: ""
    });
    const [socialCredentials, setSocialCredentials] = useState<SocialCredential[]>([]);
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});

    useEffect(() => {
        loadClients();
    }, []);

    const loadClients = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/clients');
            if (res.ok) {
                const data = await res.json();
                setClients(data.clients || []);
            }
        } catch (error) {
            console.error("Error loading clients:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenCreate = () => {
        setEditingId(null);
        setFormData({
            name: "",
            instagram: "",
            industry: "",
            contactPhone: "",
            whatsapp: "",
            paymentDay: "",
            brandColor: "#000000",
            logoUrl: "",
            contactPerson: "",
            email: "",
            address: "",
            taxId: "",
            website: "",
            notes: ""
        });
        setSocialCredentials([]);
        setActiveTab('info');
        setShowForm(true);
    };

    const handleOpenEdit = (client: Client) => {
        setEditingId(client.id);
        setFormData({
            name: client.name,
            instagram: client.instagram || "",
            industry: client.industry || "",
            contactPhone: client.contactPhone || "",
            whatsapp: client.whatsapp || "",
            paymentDay: client.paymentDay || "",
            brandColor: client.brandColor || "#000000",
            logoUrl: client.logoUrl || "",
            contactPerson: client.contactName || "",
            email: client.email || "",
            address: client.address || "",
            taxId: client.taxId || "",
            website: client.website || "",
            notes: client.notes || ""
        });
        setSocialCredentials(client.socialCredentials || []);
        setActiveTab('info');
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) return;

        setIsSaving(true);
        try {
            const method = editingId ? 'PUT' : 'POST';
            const body = editingId
                ? { id: editingId, ...formData, socialCredentials }
                : { ...formData, socialCredentials };

            const res = await fetch('/api/clients', {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                const data = await res.json();
                if (editingId) {
                    setClients(clients.map(c => c.id === editingId ? data.client : c));
                    alert("Cliente actualizado");
                } else {
                    setClients([data.client, ...clients]);
                    alert(`¡Cliente creado con éxito!`);
                }
                setShowForm(false);
            } else {
                const error = await res.json();
                alert(`Error: ${error.error}`);
            }
        } catch (error) {
            console.error("Error saving client:", error);
            alert("Error al guardar cliente");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`¿Estás seguro que deseas eliminar a ${name}?`)) return;

        try {
            const res = await fetch(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
            if (res.ok) {
                setClients(clients.filter(c => c.id !== id));
            } else {
                alert("Error al eliminar");
            }
        } catch (error) {
            alert("Error de conexión");
        }
    };

    const copyPortalLink = (token: string) => {
        const link = `${window.location.origin}/portal/${token}`;
        navigator.clipboard.writeText(link);
        alert(`Link copiado!`);
    };

    const openWhatsApp = (whatsapp: string) => {
        const number = whatsapp.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${number}`, '_blank');
    };

    // Social Credentials Handlers
    const addCredential = () => {
        setSocialCredentials([...socialCredentials, { platform: '', username: '', password: '' }]);
    };

    const updateCredential = (index: number, field: keyof SocialCredential, value: string) => {
        const updated = [...socialCredentials];
        updated[index][field] = value;
        setSocialCredentials(updated);
    };

    const removeCredential = (index: number) => {
        setSocialCredentials(socialCredentials.filter((_, i) => i !== index));
    };

    const togglePasswordVisibility = (index: number) => {
        setShowPasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    // Filter Logic
    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const tabs: { id: FormTab; label: string; icon: React.ReactNode }[] = [
        { id: 'info', label: 'Info', icon: <Building2 className="w-4 h-4" /> },
        { id: 'contact', label: 'Contacto', icon: <User className="w-4 h-4" /> },
        { id: 'credentials', label: 'Redes', icon: <Lock className="w-4 h-4" /> },
        { id: 'notes', label: 'Notas', icon: <StickyNote className="w-4 h-4" /> }
    ];

    return (
        <div className="space-y-8 min-h-screen pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="lumen-title text-4xl font-black text-gray-900 tracking-tight">
                        Cartera de Clientes
                    </h1>
                    <p className="text-gray-500 text-sm mt-2 max-w-xl">
                        Gestiona los perfiles, accesos al portal y relaciones comerciales de cada cliente.
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        className="lumen-btn lumen-btn-ghost text-gray-600"
                        onClick={loadClients}
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Sincronizar
                    </button>
                    <button
                        className="lumen-btn lumen-btn-primary"
                        onClick={handleOpenCreate}
                    >
                        <Plus className="w-4 h-4" />
                        Nuevo Cliente
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por nombre, rubro..."
                    className="w-full pl-11 pr-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority/50 outline-none shadow-sm transition-all"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {isLoading && clients.length === 0 ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
                        ))
                    ) : filteredClients.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>No se encontraron clientes</p>
                        </div>
                    ) : (
                        filteredClients.map((client) => (
                            <motion.div
                                key={client.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setSelectedClient(client)}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col cursor-pointer" style={{ '--brand-color': client.brandColor || '#f59e0b' } as React.CSSProperties}
                            >
                                {/* Decorative Gradient */}
                                <div className="h-2 w-full transition-all duration-500" style={{ background: client.brandColor ? `linear-gradient(to right, ${client.brandColor}, ${client.brandColor}88)` : 'linear-gradient(to right, #f3f4f6, white)' }} />

                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-xl font-bold text-gray-400 transition-colors" style={{ backgroundColor: client.brandColor ? `${client.brandColor}20` : '', color: client.brandColor || '' }}>
                                            {client.name.charAt(0)}
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(client)} className="h-8 w-8 hover:bg-blue-50 hover:text-blue-600">
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleDelete(client.id, client.name)} className="h-8 w-8 hover:bg-red-50 hover:text-red-500">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{client.name}</h3>
                                    <p className="text-sm text-gray-500 flex items-center gap-1.5 mb-4">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {client.industry || "Sin rubro"}
                                    </p>

                                    {/* Financial Status */}
                                    {client.outstandingBalance ? (
                                        <div className="mb-4 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-3">
                                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Saldo Pendiente</p>
                                                <p className="text-red-700 font-bold font-mono">
                                                    ${client.outstandingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mb-4 bg-green-50/50 border border-green-100/50 rounded-lg p-2 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-400" />
                                            <span className="text-xs font-medium text-green-700">Al día</span>
                                        </div>
                                    )}

                                    {/* Contact Info */}
                                    <div className="mt-auto space-y-2 pt-4 border-t border-gray-50">
                                        {client.contactPhone && (
                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                                                    {client.contactPhone}
                                                </div>
                                                {(client.whatsapp || client.contactPhone) && (
                                                    <button
                                                        onClick={() => openWhatsApp(client.whatsapp || client.contactPhone || '')}
                                                        className="flex items-center gap-1 px-2 py-1 bg-green-500 hover:bg-green-600 text-white rounded-lg text-[10px] font-medium transition-colors"
                                                    >
                                                        <MessageCircle className="w-3 h-3" />
                                                        WhatsApp
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {client.instagram && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <Instagram className="w-3.5 h-3.5 text-gray-400" />
                                                <a href={`https://instagram.com/${client.instagram}`} target="_blank" className="hover:text-pink-600 hover:underline">
                                                    @{client.instagram.replace('@', '')}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Quick Access Links */}
                                <div className="bg-gray-50/80 px-4 py-2 border-t border-gray-100 flex items-center gap-1">
                                    <Link
                                        href={`/dashboard/admin/clients/${client.erpId}?tab=finanzas`}
                                        className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-lumen-priority hover:bg-white rounded-lg transition-all"
                                    >
                                        <FileText className="w-3 h-3" />
                                        Facturas
                                    </Link>
                                    <Link
                                        href={`/dashboard/admin/clients/${client.erpId}?tab=documentos`}
                                        className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] font-medium text-gray-500 hover:text-lumen-priority hover:bg-white rounded-lg transition-all"
                                    >
                                        <FolderOpen className="w-3 h-3" />
                                        Documentos
                                    </Link>
                                </div>

                                {/* Actions Footer */}
                                <div className="bg-gray-50/50 p-3 flex gap-2 border-t border-gray-100">
                                    <Button
                                        onClick={() => copyPortalLink(client.portalToken)}
                                        variant="outline"
                                        className="flex-1 text-xs h-9 bg-white border-gray-200 hover:bg-gray-50 hover:text-lumen-priority"
                                    >
                                        <LinkIcon className="w-3 h-3 mr-2" />
                                        Copiar Portal
                                    </Button>
                                    <Link href={`/portal/${client.portalToken}`} target="_blank" className="flex-shrink-0">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 border border-gray-200 bg-white text-gray-400 hover:text-lumen-view">
                                            <ExternalLink className="w-4 h-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            
            {/* Modal de Perfil del Cliente Centrado */}
            <AnimatePresence>
                {selectedClient && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedClient(null)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-md pointer-events-auto"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-[480px] bg-white sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-50 flex flex-col overflow-hidden pointer-events-auto"
                        >
                            <div className="flex-1 overflow-y-auto">
                                {/* Header del Modal */}
                                <div className="p-8 relative overflow-hidden" style={{ backgroundColor: selectedClient.brandColor || '#111827' }}>
                                    <div className="absolute top-4 right-4 flex gap-2">
                                        <button onClick={() => {
                                            handleOpenEdit(selectedClient);
                                            setSelectedClient(null);
                                        }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setSelectedClient(null)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white backdrop-blur-md transition-colors">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col items-center pt-4">
                                        <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4 border border-white/20">
                                            {selectedClient.name.charAt(0)}
                                        </div>
                                        <h2 className="text-2xl font-bold text-white text-center">{selectedClient.name}</h2>
                                        <p className="text-gray-400 mt-1 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            {selectedClient.industry || "Sin rubro"}
                                        </p>
                                    </div>
                                </div>

                                {/* Contenido del Perfil */}
                                <div className="p-6 space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Contacto</p>
                                            <p className="text-sm font-bold text-gray-900">{selectedClient.contactName || "No especificado"}</p>
                                            {selectedClient.contactPhone && (
                                                <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
                                                    <Phone className="w-3.5 h-3.5" />
                                                    {selectedClient.contactPhone}
                                                </p>
                                            )}
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-1">Día de Pago</p>
                                            <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-gray-400" />
                                                {selectedClient.paymentDay ? `Día ${selectedClient.paymentDay}` : "No definido"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Enlaces y Redes</h3>
                                        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
                                            {selectedClient.instagram && (
                                                <a href={`https://instagram.com/${selectedClient.instagram.replace('@', '')}`} target="_blank" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-500 flex items-center justify-center">
                                                        <Instagram className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{selectedClient.instagram}</p>
                                                        <p className="text-xs text-gray-500">Instagram</p>
                                                    </div>
                                                </a>
                                            )}
                                            {selectedClient.whatsapp && (
                                                <a href={`https://wa.me/${selectedClient.whatsapp.replace(/\D/g, '')}`} target="_blank" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-500 flex items-center justify-center">
                                                        <MessageSquare className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{selectedClient.whatsapp}</p>
                                                        <p className="text-xs text-gray-500">WhatsApp</p>
                                                    </div>
                                                </a>
                                            )}
                                            {selectedClient.website && (
                                                <a href={selectedClient.website} target="_blank" className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center">
                                                        <Globe className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">Sitio Web</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[200px]">{selectedClient.website}</p>
                                                    </div>
                                                </a>
                                            )}
                                            {!selectedClient.instagram && !selectedClient.whatsapp && !selectedClient.website && (
                                                <p className="text-sm text-gray-500 p-4 text-center">No hay enlaces registrados.</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Link Portal & Hub */}
                                    <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-100">
                                        <a href={`/dashboard/hub/${selectedClient.id}`} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-lumen-priority/5 border border-lumen-priority/10 hover:bg-lumen-priority/10 text-lumen-priority transition-colors">
                                            <LayoutDashboard className="w-6 h-6" />
                                            <span className="text-sm font-bold">Ir al Hub</span>
                                        </a>
                                        <button onClick={() => {
                                            navigator.clipboard.writeText(`${window.location.origin}/portal/${selectedClient.portalToken}`);
                                            alert("Link del portal copiado!");
                                        }} className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:bg-gray-100 text-gray-600 transition-colors">
                                            <ExternalLink className="w-6 h-6" />
                                            <span className="text-sm font-bold">Copiar Portal</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Footer Danger Zone */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50">
                                <button
                                    onClick={() => {
                                        handleDelete(selectedClient.id, selectedClient.name);
                                        setSelectedClient(null);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-3 text-red-500 font-medium hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Eliminar Cliente Definitivamente
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

{/* Form Modal with Tabs */}
            <AnimatePresence>
                {showForm && (
                    <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-4 border-b border-gray-100 flex justify-between items-center flex-shrink-0">
                                <h2 className="text-lg font-bold text-gray-900">
                                    {editingId ? "✏️ Editar Cliente" : "✨ Nuevo Cliente"}
                                </h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full hover:bg-gray-100">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-gray-100 px-4 bg-gray-50/50 flex-shrink-0">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                                            ? 'border-lumen-priority text-lumen-priority bg-white/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        {tab.icon}
                                        <span className="hidden sm:inline">{tab.label}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                {/* INFO TAB */}
                                {activeTab === 'info' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Nombre del Cliente *</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all font-medium"
                                                placeholder="Ej: Fundación San José"
                                                value={formData.name}
                                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Color de Marca</label>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="color"
                                                    value={formData.brandColor}
                                                    onChange={e => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="w-12 h-12 p-1 bg-white border border-gray-200 rounded-xl cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={formData.brandColor}
                                                    onChange={e => setFormData({ ...formData, brandColor: e.target.value })}
                                                    className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm uppercase"
                                                    placeholder="#000000"
                                                />
                                            </div>
                                        </div>


                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Rubro</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                    placeholder="Ej: Salud"
                                                    value={formData.industry}
                                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instagram</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                    placeholder="@usuario"
                                                    value={formData.instagram}
                                                    onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">RIF/NIT</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                    placeholder="J-12345678-9"
                                                    value={formData.taxId}
                                                    onChange={e => setFormData({ ...formData, taxId: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Sitio Web</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                    placeholder="https://..."
                                                    value={formData.website}
                                                    onChange={e => setFormData({ ...formData, website: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* CONTACT TAB */}
                                {activeTab === 'contact' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Persona de Contacto</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                placeholder="Ej: María López"
                                                value={formData.contactPerson}
                                                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Teléfono</label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                    placeholder="+58 412 ..."
                                                    value={formData.contactPhone}
                                                    onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                                                    WhatsApp
                                                    <MessageCircle className="w-3.5 h-3.5 text-green-500" />
                                                </label>
                                                <input
                                                    type="text"
                                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-sm"
                                                    placeholder="+58 412 ..."
                                                    value={formData.whatsapp}
                                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                                            <input
                                                type="email"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                placeholder="correo@empresa.com"
                                                value={formData.email}
                                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                placeholder="Av. Principal..."
                                                value={formData.address}
                                                onChange={e => setFormData({ ...formData, address: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Día de Pago</label>
                                            <input
                                                type="text"
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm"
                                                placeholder="Ej: 15"
                                                value={formData.paymentDay}
                                                onChange={e => setFormData({ ...formData, paymentDay: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* CREDENTIALS TAB */}
                                {activeTab === 'credentials' && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm text-gray-500">Credenciales de acceso a redes sociales del cliente</p>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={addCredential}
                                                className="text-xs"
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Agregar
                                            </Button>
                                        </div>

                                        {socialCredentials.length === 0 ? (
                                            <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <Lock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                                <p className="text-sm text-gray-400">Sin credenciales guardadas</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {socialCredentials.map((cred, index) => (
                                                    <div key={index} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <select
                                                                value={cred.platform}
                                                                onChange={e => updateCredential(index, 'platform', e.target.value)}
                                                                className="text-sm font-medium bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-lumen-priority/20"
                                                            >
                                                                <option value="">Plataforma</option>
                                                                <option value="Instagram">Instagram</option>
                                                                <option value="Facebook">Facebook</option>
                                                                <option value="TikTok">TikTok</option>
                                                                <option value="YouTube">YouTube</option>
                                                                <option value="Twitter/X">Twitter/X</option>
                                                                <option value="LinkedIn">LinkedIn</option>
                                                                <option value="Google Ads">Google Ads</option>
                                                                <option value="Meta Business">Meta Business</option>
                                                                <option value="Otro">Otro</option>
                                                            </select>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeCredential(index)}
                                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <input
                                                                type="text"
                                                                placeholder="Usuario"
                                                                value={cred.username}
                                                                onChange={e => updateCredential(index, 'username', e.target.value)}
                                                                className="p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lumen-priority/20"
                                                            />
                                                            <div className="relative">
                                                                <input
                                                                    type={showPasswords[index] ? "text" : "password"}
                                                                    placeholder="Contraseña"
                                                                    value={cred.password}
                                                                    onChange={e => updateCredential(index, 'password', e.target.value)}
                                                                    className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-lumen-priority/20 pr-10"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => togglePasswordVisibility(index)}
                                                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                                >
                                                                    {showPasswords[index] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                                            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <p className="text-xs text-amber-700">
                                                Las credenciales se almacenan de forma segura. Asegúrese de contar con autorización del cliente.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* NOTES TAB */}
                                {activeTab === 'notes' && (
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Notas Internas</label>
                                            <textarea
                                                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-all text-sm min-h-[200px] resize-none"
                                                placeholder="Información importante sobre el cliente, preferencias, historial de comunicación, etc..."
                                                value={formData.notes}
                                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            Estas notas son internas y no serán visibles para el cliente.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-6 pt-4 bg-gray-50/50 border-t border-gray-100 flex gap-3 flex-shrink-0">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowForm(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-black text-white hover:bg-gray-800 shadow-lg shadow-black/20"
                                    onClick={handleSave}
                                    disabled={isSaving || !formData.name}
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Cliente"}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
