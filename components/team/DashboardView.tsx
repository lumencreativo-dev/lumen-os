"use client";

import { useState, useEffect } from "react";
import {
    Loader2, RefreshCw, Users, FileText, DollarSign,
    TrendingUp, AlertCircle, CheckCircle, Clock, Target,
    ArrowUpRight, BarChart3, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface DashboardStats {
    clients: {
        total: number;
        active: number;
    };
    leads: {
        total: number;
        newToday: number;
    };
    deliverables: {
        pending: number;
        approved: number;
        total: number;
    };
    finance: {
        totalReceived: number;
        outstanding: number;
        overdue: number;
    };
}

export default function DashboardView() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchWithTimeout = async (url: string, ms = 5000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), ms);
        try {
            const res = await fetch(url, { signal: controller.signal });
            clearTimeout(id);
            return res;
        } catch {
            clearTimeout(id);
            return null; // Timeout o error de red
        }
    };

    const fetchStats = async () => {
        setIsLoading(true);
        setError("");
        try {
            // Fetch all data in parallel (con timeout de 5s cada uno)
            const [clientsRes, leadsRes, deliverablesRes, financeRes] = await Promise.all([
                fetchWithTimeout('/api/clients'),
                fetchWithTimeout('/api/leads'),
                fetchWithTimeout('/api/deliverables'),
                Promise.resolve(new Response(JSON.stringify({ invoices: [], payments: [] }), { status: 200 })),
            ]);

            // Parse responses
            const clientsData = clientsRes?.ok ? await clientsRes.json() : { clients: [] };
            const leadsData = leadsRes?.ok ? await leadsRes.json() : { leads: [] };
            const deliverablesData = deliverablesRes?.ok ? await deliverablesRes.json() : { deliverables: [] };
            const financeData = financeRes?.ok ? await financeRes.json() : { invoices: [], payments: [] };


            // Calculate stats
            const clients = clientsData.clients || [];
            const leads = leadsData.leads || [];
            const deliverables = deliverablesData.deliverables || [];
            const invoices = financeData.invoices || [];
            const payments = financeData.payments || [];

            const newLeadsToday = leads.filter((l: any) => {
                const leadDate = new Date(l.creation).toDateString();
                const today = new Date().toDateString();
                return leadDate === today;
            }).length;

            const pendingDeliverables = deliverables.filter((d: any) => d.status === 'pending').length;
            const approvedDeliverables = deliverables.filter((d: any) => d.status === 'approved').length;

            const totalReceived = payments
                .filter((p: any) => p.payment_type === "Receive")
                .reduce((acc: number, p: any) => acc + (p.paid_amount || 0), 0);

            const outstanding = invoices.reduce((acc: number, inv: any) =>
                acc + (inv.outstanding_amount || 0), 0);

            const overdueCount = invoices.filter((inv: any) => inv.status === 'Overdue').length;

            setStats({
                clients: {
                    total: clients.length,
                    active: clients.length, // Could filter by active status if available
                },
                leads: {
                    total: leads.length,
                    newToday: newLeadsToday,
                },
                deliverables: {
                    pending: pendingDeliverables,
                    approved: approvedDeliverables,
                    total: deliverables.length,
                },
                finance: {
                    totalReceived,
                    outstanding,
                    overdue: overdueCount,
                }
            });

        } catch (err) {
            console.error("Error fetching dashboard stats:", err);
            setError("Error al cargar estadísticas");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-lumen-priority" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 text-red-600 p-6 rounded-xl text-center">
                {error}
                <Button variant="link" onClick={fetchStats} className="ml-2">Reintentar</Button>
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="space-y-8">
            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchStats}
                    disabled={isLoading}
                    className="text-gray-500"
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Actualizar
                </Button>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Clients */}
                <Link href="/dashboard/admin/clients" className="group">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-lumen-priority/30 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600 group-hover:scale-110 transition-transform">
                                <Users className="w-6 h-6" />
                            </div>
                            <ArrowUpRight className="w-4 h-4 text-gray-300 group-hover:text-lumen-priority transition-colors" />
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Clientes Activos</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.clients.total}</h3>
                    </div>
                </Link>

                {/* Leads */}
                <Link href="/dashboard/leads" className="group">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-green-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-green-50 rounded-xl text-green-600 group-hover:scale-110 transition-transform">
                                <Target className="w-6 h-6" />
                            </div>
                            {stats.leads.newToday > 0 && (
                                <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full animate-pulse">
                                    +{stats.leads.newToday} hoy
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Leads Activos</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.leads.total}</h3>
                    </div>
                </Link>

                {/* Deliverables */}
                <Link href="/dashboard/deliverables" className="group">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-amber-50 rounded-xl text-amber-600 group-hover:scale-110 transition-transform">
                                <FileText className="w-6 h-6" />
                            </div>
                            {stats.deliverables.pending > 0 && (
                                <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                                    {stats.deliverables.pending} pendientes
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Entregables</p>
                        <h3 className="text-3xl font-bold text-gray-900">{stats.deliverables.total}</h3>
                    </div>
                </Link>

                {/* Finance */}
                <Link href="/dashboard/finance" className="group">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg hover:border-purple-300 transition-all relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5">
                            <DollarSign className="w-24 h-24" />
                        </div>
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-6 h-6" />
                            </div>
                            {stats.finance.overdue > 0 && (
                                <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-1 rounded-full">
                                    {stats.finance.overdue} vencidas
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mb-1">Por Cobrar</p>
                        <h3 className="text-3xl font-bold text-gray-900">
                            ${stats.finance.outstanding.toLocaleString()}
                        </h3>
                    </div>
                </Link>
            </div>

            {/* Secondary Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl text-white">
                    <h3 className="font-bold mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-lumen-priority" />
                        Acciones Rápidas
                    </h3>
                    <div className="space-y-2">
                        <Link href="/dashboard/admin/clients">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                <span className="text-sm">Nuevo Cliente</span>
                                <Users className="w-4 h-4" />
                            </div>
                        </Link>
                        <Link href="/dashboard/deliverables">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                <span className="text-sm">Nuevo Entregable</span>
                                <FileText className="w-4 h-4" />
                            </div>
                        </Link>
                        <Link href="/dashboard/finance">
                            <div className="flex items-center justify-between p-3 bg-white/10 rounded-xl hover:bg-white/20 transition-colors">
                                <span className="text-sm">Nueva Factura</span>
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Deliverables Status */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-400" />
                        Estado Entregables
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Aprobados</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.deliverables.approved}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                                <span className="text-sm text-gray-600">Pendientes</span>
                            </div>
                            <span className="font-bold text-gray-900">{stats.deliverables.pending}</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                                style={{
                                    width: stats.deliverables.total > 0
                                        ? `${(stats.deliverables.approved / stats.deliverables.total) * 100}%`
                                        : '0%'
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-400">
                            {stats.deliverables.total > 0
                                ? `${Math.round((stats.deliverables.approved / stats.deliverables.total) * 100)}% tasa de aprobación`
                                : 'Sin entregables'}
                        </p>
                    </div>
                </div>

                {/* Finance Summary */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-400" />
                        Resumen Financiero
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700">Recibido</span>
                            </div>
                            <span className="font-bold text-green-700 font-mono">
                                ${stats.finance.totalReceived.toLocaleString()}
                            </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-600" />
                                <span className="text-sm text-amber-700">Por Cobrar</span>
                            </div>
                            <span className="font-bold text-amber-700 font-mono">
                                ${stats.finance.outstanding.toLocaleString()}
                            </span>
                        </div>
                        {stats.finance.overdue > 0 && (
                            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                                <div className="flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm text-red-700">Facturas Vencidas</span>
                                </div>
                                <span className="font-bold text-red-700">{stats.finance.overdue}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
