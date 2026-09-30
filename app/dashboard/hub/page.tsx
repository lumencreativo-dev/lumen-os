"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Briefcase,
    Search,
    Plus,
    ChevronRight,
    Globe,
    Instagram,
    Mail,
    Sparkles
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface ClientRow {
    id: string;
    name: string;
    logo: string | null;
    email: string | null;
    portalToken: string;
    createdAt: string;
}

export default function HubPage() {
    const [clients, setClients] = useState<ClientRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => {
        async function fetchClients() {
            const supabase = createClient();
            const { data, error } = await supabase
                .from("Client")
                .select("id, name, logo, email, portalToken, createdAt")
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
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Briefcase className="w-6 h-6 text-lumen-priority" />
                        Hub de Clientes
                    </h1>
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
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lumen-priority"></div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map((client) => (
                        <Link
                            key={client.id}
                            href={`/dashboard/hub/${client.id}`}
                            className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-lumen-priority/30 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {client.logo ? (
                                        <img
                                            src={client.logo}
                                            alt={client.name}
                                            className="w-10 h-10 rounded-xl object-cover"
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-lumen-priority/10 flex items-center justify-center text-lumen-priority font-bold text-sm">
                                            {client.name.substring(0, 2).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 group-hover:text-lumen-priority transition-colors">
                                            {client.name}
                                        </h3>
                                        {client.email && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                {client.email}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-lumen-priority transition-colors" />
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-400">
                                <span className="bg-gray-100 px-2 py-1 rounded-lg">
                                    Identidad · Fechas · Prompts
                                </span>
                            </div>
                        </Link>
                    ))}
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
