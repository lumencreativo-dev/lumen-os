"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { clientService } from "@/lib/clients";
import { Client, SocialCredential } from "@/types/clients";
import { Button } from "@/components/ui/button";
import {
    Building2, Mail, Phone, Globe, FileText, CreditCard,
    Palette, Type, Layout, ArrowLeft, ExternalLink,
    Download, Loader2, DollarSign, Calendar, Lock, Copy,
    Eye, EyeOff, StickyNote, MessageCircle, Check, FolderOpen
} from "lucide-react";
import Link from "next/link";
import { ERPNextInvoice, ERPNextPayment } from "@/types/erpnext";

export default function ClientProfilePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params?.id as string;
    const initialTab = searchParams?.get('tab') as 'info' | 'strategy' | 'brand' | 'finance' | 'credentials' | 'documentos' || 'info';

    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'info' | 'strategy' | 'brand' | 'finance' | 'credentials' | 'documentos'>(initialTab);

    // ERP Data
    const [financials, setFinancials] = useState<{ invoices: ERPNextInvoice[], payments: ERPNextPayment[] }>({ invoices: [], payments: [] });
    const [loadingFinancials, setLoadingFinancials] = useState(false);

    // Local Data (Strategy & Brand)
    const [strategy, setStrategy] = useState("");
    const [brandKit, setBrandKit] = useState({
        primaryColor: "#000000",
        secondaryColor: "#ffffff",
        fontHeading: "Inter",
        fontBody: "Roboto",
        logoUrl: ""
    });

    // Credentials visibility state
    const [showPasswords, setShowPasswords] = useState<Record<number, boolean>>({});
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    useEffect(() => {
        if (id) {
            loadClientData();
        }
    }, [id]);

    useEffect(() => {
        if (initialTab) {
            // Map URL params to tab names
            const tabMap: Record<string, 'info' | 'strategy' | 'brand' | 'finance' | 'credentials' | 'documentos'> = {
                'finanzas': 'finance',
                'finance': 'finance',
                'documentos': 'documentos',
                'credentials': 'credentials',
                'redes': 'credentials',
                'brand': 'brand',
                'strategy': 'strategy',
                'info': 'info'
            };
            setActiveTab(tabMap[initialTab] || 'info');
        }
    }, [initialTab]);

    const loadClientData = async () => {
        setLoading(true);
        // 1. Get Client Basic Info
        const clientData = await clientService.getById(id);

        if (clientData) {
            setClient(clientData);

            // 2. Load Local Extensions (Strategy/Brand)
            const storedStrategy = localStorage.getItem(`lumen_strategy_${id}`);
            if (storedStrategy) setStrategy(storedStrategy);

            const storedBrand = localStorage.getItem(`lumen_brand_${id}`);
            if (storedBrand) setBrandKit(JSON.parse(storedBrand));

            // 3. Load Financials
            if (clientData.id) {
                setLoadingFinancials(true);
                try {
                    // TODO: Load financials from Prisma (invoices, payments)
                    // For now, just set empty
                    setFinancials({ invoices: [], payments: [] });
                } catch (e) {
                    console.error("Failed to load financials", e);
                } finally {
                    setLoadingFinancials(false);
                }
            }
        }
        setLoading(false);
    };

    const saveExtensions = () => {
        if (!client) return;
        localStorage.setItem(`lumen_strategy_${client.id}`, strategy);
        localStorage.setItem(`lumen_brand_${client.id}`, JSON.stringify(brandKit));
        alert("✅ Información guardada localmente");
    };

    const copyToClipboard = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const togglePasswordVisibility = (index: number) => {
        setShowPasswords(prev => ({ ...prev, [index]: !prev[index] }));
    };

    const openWhatsApp = (number: string) => {
        const cleaned = number.replace(/[^0-9]/g, '');
        window.open(`https://wa.me/${cleaned}`, '_blank');
    };

    const erpNextUrl = process.env.NEXT_PUBLIC_ERP_URL || 'http://lumen.local:8080';

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando perfil...</div>;
    if (!client) return <div className="p-8 text-center text-red-500">Cliente no encontrado</div>;

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/admin/clients">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                        {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {client.industry || "Sin industria"}</span>
                            <span className="text-gray-300">•</span>
                            <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">ID: {client.erpId || "N/A"}</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                    {(client.whatsapp || client.contactPhone) && (
                        <Button
                            variant="outline"
                            onClick={() => openWhatsApp(client.whatsapp || client.contactPhone || '')}
                            className="border-green-200 text-green-700 hover:bg-green-50"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            WhatsApp
                        </Button>
                    )}
                    {client.erpId && !client.erpId.startsWith('LOCAL') && (
                        <Button variant="outline" onClick={() => window.open(`${erpNextUrl}/app/customer/${client.erpId}`, '_blank')} className="border-blue-200 text-blue-700 hover:bg-blue-50">
                            <ExternalLink className="w-4 h-4 mr-2" />
                            ERPNext
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => window.open(`/portal/${client.portalToken}`, '_blank')}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Portal
                    </Button>
                    <Button onClick={saveExtensions} className="bg-lumen-priority text-white">
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex space-x-4 md:space-x-8 min-w-max">
                    {[
                        { id: 'info', label: 'General', icon: FileText },
                        { id: 'credentials', label: 'Credenciales', icon: Lock },
                        { id: 'finance', label: 'Finanzas', icon: DollarSign },
                        { id: 'documentos', label: 'Documentos', icon: FolderOpen },
                        { id: 'strategy', label: 'Estrategia', icon: Layout },
                        { id: 'brand', label: 'Brand Kit', icon: Palette }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-lumen-priority text-lumen-priority'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="mt-6">
                {activeTab === 'info' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                            <h3 className="font-bold text-gray-900 mb-4">Información de Contacto</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <span>{client.contactPhone || "No registrado"}</span>
                                </div>
                                {client.whatsapp && client.whatsapp !== client.contactPhone && (
                                    <div className="flex items-center gap-3 text-sm">
                                        <MessageCircle className="w-4 h-4 text-green-500" />
                                        <span>{client.whatsapp}</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span>{client.email || "No registrado"}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <Globe className="w-4 h-4 text-gray-400" />
                                    <span>{client.instagram ? `@${client.instagram}` : "No registrado"}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Cliente desde</p>
                                    <p className="font-medium">{new Date(client.createdAt || Date.now()).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                        {/* Notes Section */}
                        {client.notes && (
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <StickyNote className="w-4 h-4 text-amber-500" />
                                    Notas Internas
                                </h3>
                                <div className="bg-amber-50/50 border border-amber-100 rounded-lg p-4">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-4">Contrato y Legal</h3>
                            <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 text-center">
                                <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-600 mb-4">Contrato de Servicios 2024.pdf</p>
                                <Button variant="outline" size="sm" onClick={() => alert("Descarga simulada")}>
                                    <Download className="w-4 h-4 mr-2" />
                                    Descargar PDF
                                </Button>
                            </div>
                            <div className="mt-4 text-xs text-gray-400">
                                <p>Estado: <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded">VIGENTE</span></p>
                                <p className="mt-1">Renovación automática: 15/01/2026</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* CREDENTIALS TAB */}
                {activeTab === 'credentials' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-gray-500" />
                                    Credenciales de Redes Sociales
                                </h3>
                            </div>

                            {!client.socialCredentials || client.socialCredentials.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No hay credenciales guardadas para este cliente.</p>
                                    <p className="text-sm text-gray-400 mt-1">Edita el cliente para agregar credenciales.</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {client.socialCredentials.map((cred, index) => (
                                        <div key={index} className="p-4 hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="font-semibold text-gray-900 flex items-center gap-2">
                                                    {cred.platform === 'Instagram' && <span className="text-pink-500">📸</span>}
                                                    {cred.platform === 'Facebook' && <span className="text-blue-600">📘</span>}
                                                    {cred.platform === 'TikTok' && <span>🎵</span>}
                                                    {cred.platform === 'YouTube' && <span className="text-red-600">▶️</span>}
                                                    {cred.platform === 'Twitter/X' && <span>𝕏</span>}
                                                    {cred.platform === 'LinkedIn' && <span className="text-blue-700">in</span>}
                                                    {!['Instagram', 'Facebook', 'TikTok', 'YouTube', 'Twitter/X', 'LinkedIn'].includes(cred.platform) && <span>🔗</span>}
                                                    {cred.platform || 'Sin nombre'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                                    <span className="text-xs text-gray-400 uppercase font-bold w-16">Usuario</span>
                                                    <span className="text-sm text-gray-700 flex-1 font-mono">{cred.username}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(cred.username, index * 2)}
                                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        {copiedIndex === index * 2 ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                                                    <span className="text-xs text-gray-400 uppercase font-bold w-16">Clave</span>
                                                    <span className="text-sm text-gray-700 flex-1 font-mono">
                                                        {showPasswords[index] ? cred.password : '••••••••'}
                                                    </span>
                                                    <button
                                                        onClick={() => togglePasswordVisibility(index)}
                                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        {showPasswords[index] ? (
                                                            <EyeOff className="w-4 h-4 text-gray-400" />
                                                        ) : (
                                                            <Eye className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => copyToClipboard(cred.password, index * 2 + 1)}
                                                        className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                                                    >
                                                        {copiedIndex === index * 2 + 1 ? (
                                                            <Check className="w-4 h-4 text-green-500" />
                                                        ) : (
                                                            <Copy className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm text-amber-800 font-medium">Información Sensible</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Las credenciales se almacenan de forma segura. Solo usuarios autorizados pueden ver esta información.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* DOCUMENTOS TAB */}
                {activeTab === 'documentos' && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <FolderOpen className="w-4 h-4 text-gray-500" />
                                    Documentos Importantes
                                </h3>
                            </div>

                            <div className="p-12 text-center">
                                <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">Próximamente: Gestión de documentos del cliente</p>
                                <p className="text-sm text-gray-400 mt-1">Contratos, facturas, y archivos importantes.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'finance' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase font-bold">Total Facturado</p>
                                <p className="text-2xl font-bold text-gray-900">$ {financials.invoices.reduce((acc, curr) => acc + curr.grand_total, 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase font-bold">Pagos Recibidos</p>
                                <p className="text-2xl font-bold text-green-600">$ {financials.payments.reduce((acc, curr) => acc + curr.paid_amount, 0).toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs text-gray-500 uppercase font-bold">Por Cobrar</p>
                                <p className="text-2xl font-bold text-red-500">$ {(financials.invoices.reduce((acc, curr) => acc + curr.grand_total, 0) - financials.payments.reduce((acc, curr) => acc + curr.paid_amount, 0)).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h3 className="font-bold text-gray-900">Facturas Recientes (ERPNext)</h3>
                            </div>
                            {loadingFinancials ? (
                                <div className="p-8 text-center text-gray-500 flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4" /> Conectando con ERPNext...
                                </div>
                            ) : financials.invoices.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No se encontraron facturas asociadas a {client.name}.</div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">ID</th>
                                            <th className="px-6 py-3">Fecha</th>
                                            <th className="px-6 py-3">Estado</th>
                                            <th className="px-6 py-3 text-right">Monto</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {financials.invoices.map(inv => (
                                            <tr key={inv.name}>
                                                <td className="px-6 py-4 font-mono">{inv.name}</td>
                                                <td className="px-6 py-4">{inv.posting_date}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-100 text-green-700' :
                                                        inv.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                        }`}>{inv.status}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-medium">{inv.currency} {inv.grand_total.toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'brand' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Palette className="w-5 h-5 text-lumen-priority" /> Kit de Marca
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Paleta de Colores</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            className="w-12 h-12 rounded cursor-pointer border-0 p-0 shadow-sm"
                                            value={brandKit.primaryColor}
                                            onChange={(e) => setBrandKit({ ...brandKit, primaryColor: e.target.value })}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Color Primario</p>
                                            <code className="text-xs text-gray-500">{brandKit.primaryColor}</code>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="color"
                                            className="w-12 h-12 rounded cursor-pointer border-0 p-0 shadow-sm"
                                            value={brandKit.secondaryColor}
                                            onChange={(e) => setBrandKit({ ...brandKit, secondaryColor: e.target.value })}
                                        />
                                        <div>
                                            <p className="font-medium text-gray-900">Color Secundario</p>
                                            <code className="text-xs text-gray-500">{brandKit.secondaryColor}</code>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 uppercase mb-4">Tipografías</h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Títulos / Headings</label>
                                        <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                                            <Type className="w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full text-sm outline-none"
                                                value={brandKit.fontHeading}
                                                onChange={(e) => setBrandKit({ ...brandKit, fontHeading: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-400 mb-1">Cuerpo / Body</label>
                                        <div className="flex items-center gap-2 border border-gray-200 rounded p-2">
                                            <Type className="w-4 h-4 text-gray-400" />
                                            <input
                                                type="text"
                                                className="w-full text-sm outline-none"
                                                value={brandKit.fontBody}
                                                onChange={(e) => setBrandKit({ ...brandKit, fontBody: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'strategy' && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-[500px] flex flex-col">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Layout className="w-5 h-5 text-lumen-priority" /> Estrategia de Contenido
                        </h3>
                        <textarea
                            className="flex-1 w-full p-4 rounded-lg bg-gray-50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-lumen-priority/20 outline-none resize-none font-mono text-sm leading-relaxed"
                            placeholder="# Estrategia Q1 2026&#10;&#10;Objetivos:&#10;- Aumentar engagement en un 20%&#10;- Implementar formato Reel semanal&#10;&#10;Pilares de Contenido:&#10;1. Educativo&#10;2. Inspiracional&#10;3. Venta Suave"
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                        ></textarea>
                        <p className="text-xs text-gray-400 mt-2">Puedes usar formato Markdown simple.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
