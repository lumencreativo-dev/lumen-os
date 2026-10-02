"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DeliverableCard } from "@/components/portal/DeliverableCard";
import { DeliverableModal } from "@/components/portal/DeliverableModal";
import { ContentCalendar } from "@/components/portal/ContentCalendar";
import { ProjectProgress } from "@/components/portal/ProjectProgress";
import { SupportChat } from "@/components/portal/SupportChat";
import { LayoutGrid, Calendar as CalendarIcon, CheckCircle2, AlertCircle, TrendingUp, Sparkles, User as UserIcon } from "lucide-react";
import { Client } from "@/types/clients";
import { motion } from "framer-motion";
import { ClientBrief } from "@/components/portal/ClientBrief";
import { useBrand } from "@/contexts/BrandContext";

// Mock Data Generators
const generateMockDeliverables = () => [
    {
        id: "1",
        title: "Post Instagram - Lanzamiento",
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&q=80",
        status: "pending" as const,
        date: "23 Ene 2026",
        description: "Post de lanzamiento para la nueva campaña. Colores vibrantes y mensaje inspirador.",
        clientName: "Cliente Demo"
    },
    {
        id: "2",
        title: "Reel - Behind the Scenes",
        type: "video" as const,
        url: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        status: "approved" as const,
        date: "20 Ene 2026",
        description: "Video mostrando el proceso creativo del equipo.",
        clientName: "Cliente Demo"
    },
    {
        id: "3",
        title: "Carousel Educativo",
        type: "carousel" as const,
        url: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80",
        carouselUrls: [
            "https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800&q=80",
            "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=800&q=80"
        ],
        status: "pending" as const,
        date: "18 Ene 2026",
        description: "Carrusel de 3 slides con tips educativos para tu audiencia.",
        clientName: "Cliente Demo"
    },
    {
        id: "4",
        title: "Story Promocional",
        type: "image" as const,
        url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
        status: "changes_requested" as const,
        date: "15 Ene 2026",
        description: "Story para promoción especial de fin de mes.",
        clientName: "Cliente Demo"
    }
];

export default function PortalPage() {
    const params = useParams();
    const token = params.token as string;
    const { setBranding } = useBrand();

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // State for interactive deliverables
    const [deliverables, setDeliverables] = useState<any[]>(generateMockDeliverables());

    // Modal state
    const [selectedDeliverable, setSelectedDeliverable] = useState<typeof deliverables[0] | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        // Validate Token & Fetch Client
        const fetchClientData = async () => {
            try {
                // Demo mode - accept any token with 'demo' or just show demo content
                if (token === 'demo' || token.includes('demo')) {
                    const demoClient = { id: 'demo', name: 'Cliente Demo', portalToken: 'demo', brandColor: '#F7931E' };
                    setClient(demoClient);
                    setBranding(demoClient.brandColor, null, demoClient.name);
                    setLoading(false);
                    return;
                }

                // Try to fetch real client data
                const res = await fetch('/api/clients');
                if (res.ok) {
                    const data = await res.json();
                    const found = data.clients?.find((c: Client) => c.portalToken === token);

                    if (found) {
                        setClient(found);
                        setBranding(found.brandColor || '#F7931E', found.logoUrl || null, found.name);
                    } else {
                        // Fallback to demo mode for any token (MVP friendly)
                        const fallback = { id: 'demo', name: 'Cliente Demo', portalToken: token };
                        setClient(fallback);
                        setBranding('#F7931E', null, fallback.name);
                    }
                } else {
                    // API error - still show demo
                    const fallback = { id: 'demo', name: 'Cliente Demo', portalToken: token };
                    setClient(fallback);
                    setBranding('#F7931E', null, fallback.name);
                }
            } catch (err) {
                // Connection error - still show demo
                const fallback = { id: 'demo', name: 'Cliente Demo', portalToken: token };
                setClient(fallback);
                setBranding('#F7931E', null, fallback.name);
            } finally {
                setLoading(false);
            }
        };

        fetchClientData();
    }, [token]);

    const handleApprove = (id: string) => {
        setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status: 'approved' as const } : d));
    };

    const handleReject = (id: string, feedback?: string) => {
        setDeliverables(prev => prev.map(d => d.id === id ? { ...d, status: 'changes_requested' as const } : d));
    };

    const openModal = (item: typeof deliverables[0]) => {
        setSelectedDeliverable(item);
        setIsModalOpen(true);
    };

    const pendingCount = deliverables.filter(d => d.status === 'pending').length;
    const approvedCount = deliverables.filter(d => d.status === 'approved').length;

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lumen-priority mx-auto mb-4"></div>
                    <p className="text-gray-500 text-sm">Cargando tu portal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 mb-2">Acceso Denegado</h1>
                <p className="text-gray-500 max-w-sm">{error}. Por favor contacta a tu ejecutivo de cuenta.</p>
            </div>
        );
    }

    const brandColor = client?.brandColor || '#F7931E';
    const logoUrl = client?.logoUrl;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Branded Hero Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div 
                    className="relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${brandColor}18 0%, ${brandColor}06 60%, transparent 100%)` }}
                >
                    {/* Decorative blob */}
                    <div 
                        className="absolute -top-12 -right-12 w-64 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
                        style={{ background: brandColor }}
                    />

                    <div className="relative z-10 p-8 flex items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            {/* Client Logo / Avatar */}
                            <div 
                                className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 overflow-hidden border-2 border-white/60"
                                style={{ background: logoUrl ? 'white' : brandColor }}
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt={client?.name} className="w-full h-full object-contain p-1" />
                                ) : (
                                    <span className="text-white text-3xl font-black">
                                        {client?.name?.substring(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: brandColor }}>
                                    Tu Portal Lumen
                                </p>
                                <h1 className="text-3xl font-black text-gray-900 leading-tight">
                                    Hola, {client?.name} <span className="inline-block animate-bounce">👋</span>
                                </h1>
                                <p className="text-gray-500 mt-1 text-sm">Bienvenido a tu espacio de trabajo. Aquí tienes el resumen de hoy.</p>
                            </div>
                        </div>

                        {/* Brand color accent badge */}
                        <div className="hidden md:flex flex-col items-center gap-2 text-right">
                            <div 
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: brandColor }}
                            />
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tu Marca</span>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">Por Aprobar</p>
                        <p className="text-2xl font-bold text-gray-900">{pendingCount}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <TrendingUp className="w-6 h-6 text-green-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Aprobados</p>
                        <p className="text-2xl font-bold text-gray-900">{approvedCount}</p>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 p-5 rounded-2xl flex items-center gap-4 hover:shadow-lg transition-shadow">
                    <div className="p-3 bg-white rounded-xl shadow-sm">
                        <CalendarIcon className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Próx. Publicación</p>
                        <p className="text-2xl font-bold text-gray-900">23 Ene</p>
                    </div>
                </div>
            </motion.div>

            {/* Main Tabs */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <Tabs defaultValue="deliverables" className="w-full">
                    <TabsList className="bg-gray-100/80 p-1 rounded-xl mb-6 flex overflow-x-auto">
                        <TabsTrigger value="deliverables" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                            <LayoutGrid className="w-4 h-4 mr-2" /> Entregables
                            {pendingCount > 0 && (
                                <span className="ml-2 bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                            <CalendarIcon className="w-4 h-4 mr-2" /> Calendario
                        </TabsTrigger>
                        <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                            <TrendingUp className="w-4 h-4 mr-2" /> Progreso
                        </TabsTrigger>
                        <TabsTrigger value="brief" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm px-4">
                            <UserIcon className="w-4 h-4 mr-2" /> Perfil & Brief
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="brief" className="mt-0">
                        {client && <ClientBrief client={client} />}
                    </TabsContent>

                    <TabsContent value="deliverables" className="mt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {deliverables.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => openModal(item)}
                                    className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                                >
                                    <DeliverableCard
                                        item={item}
                                        onApprove={(id) => { handleApprove(id); }}
                                        onReject={(id) => { handleReject(id); }}
                                    />
                                </div>
                            ))}
                        </div>

                        {deliverables.length === 0 && (
                            <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400">
                                <LayoutGrid className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <h3 className="text-lg font-bold text-gray-900 mb-2">Sin Entregables</h3>
                                <p>No tienes entregables pendientes en este momento.</p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="calendar">
                        <ContentCalendar />
                    </TabsContent>

                    <TabsContent value="progress">
                        <ProjectProgress />
                    </TabsContent>
                </Tabs>
            </motion.div>

            {/* Deliverable Modal */}
            <DeliverableModal
                item={selectedDeliverable as any}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onApprove={handleApprove}
                onReject={handleReject}
            />

            {/* Support Chat Widget */}
            <SupportChat />
        </div>
    );
}

