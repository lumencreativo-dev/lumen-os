"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Briefcase,
    Search,
    Plus,
    ChevronRight,
    Mail,
    Sparkles
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { motion } from "framer-motion";

interface ClientRow {
    id: string;
    name: string;
    logo: string | null;
    logoUrl: string | null;
    email: string | null;
    portalToken: string;
    brandColor: string | null;
    industry: string | null;
    createdAt: string;
}

export default function HubPage() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchClients() {
            const supabase = createClient();
            const { data } = await supabase
                .from("Client")
                .select("id, name, logo, logoUrl, email, portalToken, brandColor, industry, createdAt")
                .order("name", { ascending: true });

            if (data) setClients(data);
            setLoading(false);
        }
        fetchClients();
    }, []);

    const filtered = clients.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Hub de Clientes</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Centro de operaciones por cliente. Identidad, fechas y prompts.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority transition-all"
                />
            </div>

            {/* Loading */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-40 bg-gray-100 rounded-2xl animate-pulse" />
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && clients.length === 0 && (
                <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Sin clientes aún</h3>
                    <p className="text-sm text-gray-500 mb-6">
                        Agrega tu primer cliente desde el panel de Admin para comenzar a trabajar.
                    </p>
                    <Link
                        href="/dashboard/admin/clients"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-lumen-priority text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-4 h-4" />
                        Ir a Admin → Clientes
                    </Link>
                </div>
            )}

            {/* Client Grid */}
            {!loading && filtered.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((client, i) => {
                        const color = client.brandColor || '#64748b';
                        const logoSrc = client.logoUrl || client.logo;
                        
                        return (
                            <motion.div
                                key={client.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.06 }}
                            >
                                <Link
                                    href={`/dashboard/hub/${client.id}`}
                                    className="group block bg-white border border-gray-100 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300"
                                    style={{ boxShadow: `0 2px 12px ${color}15` }}
                                >
                                    {/* Brand Banner */}
                                    <div
                                        className="h-20 w-full relative flex items-end p-4"
                                        style={{ background: `linear-gradient(135deg, ${color}dd, ${color}88)` }}
                                    >
                                        <div className="absolute inset-0 opacity-10"
                                            style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }}
                                        />
                                        {/* Logo / Avatar */}
                                        <div className="absolute -bottom-5 left-4">
                                            {logoSrc ? (
                                                <img
                                                    src={logoSrc}
                                                    alt={client.name}
                                                    className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
                                                />
                                            ) : (
                                                <div
                                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black text-white border-2 border-white shadow-md"
                                                    style={{ backgroundColor: color }}
                                                >
                                                    {client.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        {/* Arrow indicator */}
                                        <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 group-hover:text-white group-hover:translate-x-1 transition-all" />
                                    </div>

                                    {/* Content */}
                                    <div className="pt-8 px-5 pb-5">
                                        <h3 className="font-bold text-gray-900 text-base group-hover:text-gray-700 transition-colors leading-tight">
                                            {client.name}
                                        </h3>
                                        {client.industry && (
                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                <Briefcase className="w-3 h-3" />
                                                {client.industry}
                                            </p>
                                        )}
                                        {client.email && !client.industry && (
                                            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {client.email}
                                            </p>
                                        )}

                                        {/* Tags */}
                                        <div className="flex items-center gap-1.5 mt-3">
                                            {['Identidad', 'Fechas', 'Prompts'].map(tag => (
                                                <span
                                                    key={tag}
                                                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                                    style={{ backgroundColor: `${color}18`, color: color }}
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </Link>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            {/* No results */}
            {!loading && clients.length > 0 && filtered.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-400">No se encontraron clientes con &quot;{search}&quot;</p>
                </div>
            )}
        </div>
    );
}
