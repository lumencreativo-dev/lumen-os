"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    LayoutList,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Home,
    Calendar,
    Shield,
    CheckCircle,
    DollarSign,
    MessageCircle,
    ChevronDown,
    ChevronRight,
    Archive,
    Briefcase,
    Moon,
    Sun
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/providers/AuthProvider";
import { ThemeProvider, useTheme } from "@/components/providers/ThemeProvider";
import { UserRole } from "@/types/auth";

// Menu Configuration with Role Access
interface MenuItem {
    name: string;
    icon: any;
    href: string;
    roles?: UserRole[]; // If undefined, accessible by all
    badge?: string;
}

// ============ MÓDULOS ACTIVOS ============
const ACTIVE_MENU_ITEMS: MenuItem[] = [
    { name: 'Inicio', icon: Home, href: '/dashboard' },
    { name: 'Hub de Clientes', icon: Briefcase, href: '/dashboard/hub' },
    { name: 'Aprobaciones', icon: CheckCircle, href: '/dashboard/deliverables' },
    { name: 'Calendario', icon: Calendar, href: '/dashboard/calendar' },
    // { name: 'Soporte', icon: MessageCircle, href: '/dashboard/support', roles: ['admin', 'sales', 'strategist'] }, // TODO: Conectar API WhatsApp Fase 8
    { name: 'Admin', icon: Settings, href: '/dashboard/admin', roles: ['admin'] },
];

// ============ MÓDULOS PAUSADOS (solo admins) ============
const FROZEN_MENU_ITEMS: MenuItem[] = [
    { name: 'Tareas', icon: LayoutList, href: '/dashboard/tasks' },
    { name: 'CRM', icon: Users, href: '/dashboard/leads' },
    { name: 'Finanzas', icon: DollarSign, href: '/dashboard/finance' },
];

function DashboardShell({ children }: { children: React.ReactNode }) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isFrozenOpen, setIsFrozenOpen] = useState(false);
    const pathname = usePathname();
    const { user, isLoading, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();

    const handleLogout = () => {
        logout();
    };

    if (isLoading) {
        return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-lumen-priority">Cargando Lumen OS...</div>;
    }

    // Filter Active Menu Items based on Role
    const visibleActiveItems = ACTIVE_MENU_ITEMS.filter(item => {
        if (!item.roles) return true;
        if (!user) return false;
        return item.roles.includes(user.role);
    });

    const isAdmin = user?.role === 'admin';

    const SidebarContent = () => (
        <div className="flex flex-col h-full bg-white text-gray-900 border-r border-gray-200">
            <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight uppercase flex items-center gap-2">
                    Lumen <span className="text-lumen-priority text-2xl">•</span> OS
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400 font-mono">v4.0.0</span>
                    {user?.role && (
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-lumen-priority/10 text-lumen-priority border border-lumen-priority/20">
                            {user.role}
                        </span>
                    )}
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
                {/* ====== MÓDULOS ACTIVOS ====== */}
                <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-4 pt-2 pb-1">
                    Operaciones
                </p>
                {visibleActiveItems.map((item) => {
                    const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-xl transition-all relative group ${
                                isActive
                                    ? "text-lumen-priority font-semibold"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200"
                            }`}
                        >
                            {/* Dot indicator — active */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-lumen-priority rounded-full" />
                            )}
                            <item.icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-lumen-priority" : "text-gray-400 group-hover:text-gray-600"}`} />
                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}

                {/* ====== MÓDULOS PAUSADOS (solo admin) ====== */}
                {isAdmin && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button
                            onClick={() => setIsFrozenOpen(!isFrozenOpen)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-[10px] uppercase font-bold text-gray-400 tracking-widest hover:text-gray-500 transition-colors"
                        >
                            <Archive className="w-3.5 h-3.5" />
                            Pausados
                            {isFrozenOpen
                                ? <ChevronDown className="w-3 h-3 ml-auto" />
                                : <ChevronRight className="w-3 h-3 ml-auto" />
                            }
                        </button>
                        {isFrozenOpen && (
                            <div className="space-y-0.5 mt-1">
                                {FROZEN_MENU_ITEMS.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-4 py-2.5 text-xs font-medium rounded-xl transition-all opacity-60 hover:opacity-100 ${isActive
                                                ? "bg-gray-100 text-gray-700"
                                                : "text-gray-500 hover:bg-gray-50"
                                                }`}
                                        >
                                            <item.icon className="w-4 h-4 text-gray-400" />
                                            {item.name}
                                            <span className="ml-auto text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded font-bold">
                                                PAUSA
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </nav>

            <div className="p-4 border-t border-gray-100 mt-auto bg-gray-50/50">
                <Link href="/dashboard/profile" className="flex items-center gap-3 mb-3 px-2 hover:bg-white p-2 rounded-lg transition-all cursor-pointer group shadow-sm border border-transparent hover:border-gray-200">
                    <div className="w-8 h-8 rounded-full bg-lumen-priority/10 flex items-center justify-center text-lumen-priority font-bold text-xs ring-1 ring-lumen-priority/20 group-hover:ring-lumen-priority transition-all">
                        {user?.name?.substring(0, 2).toUpperCase() || "KF"}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-lumen-priority transition-colors">
                            {user?.name || "Usuario"}
                        </p>
                        <p className="text-xs text-gray-500 truncate capitalize">{user?.role || "Invitado"}</p>
                    </div>
                </Link>

                {/* Theme Toggle — Pill style like CreativeDiseños */}
                <button
                    onClick={toggleTheme}
                    className="w-full flex items-center gap-1.5 mb-2 p-1 rounded-full bg-gray-100 border border-gray-200 transition-all hover:border-gray-300"
                    style={{ minHeight: '36px' }}
                >
                    {/* Día */}
                    <span className={`flex items-center gap-1.5 flex-1 justify-center py-1 px-2 rounded-full text-xs font-semibold transition-all ${
                        theme === 'light'
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500'
                    }`}>
                        <Sun className="w-3.5 h-3.5" />
                        Día
                    </span>
                    {/* Noche */}
                    <span className={`flex items-center gap-1.5 flex-1 justify-center py-1 px-2 rounded-full text-xs font-semibold transition-all ${
                        theme === 'dark'
                            ? 'bg-lumen-priority text-white shadow-sm'
                            : 'text-gray-500'
                    }`}>
                        <Moon className="w-3.5 h-3.5" />
                        Noche
                    </span>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex text-gray-900 relative font-sans">
            {/* Desktop Sidebar */}
            <aside className="w-64 fixed h-full hidden md:flex flex-col z-20 shadow-sm">
                <SidebarContent />
            </aside>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Sidebar */}
            <div className={`fixed inset-y-0 left-0 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 md:hidden border-r border-gray-200 ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                }`}>
                <SidebarContent />
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative bg-gray-50">
                {/* Mobile Header */}
                <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10 md:hidden flex justify-between items-center shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 tracking-tight uppercase">
                        Lumen <span className="text-lumen-priority">OS</span>
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="text-gray-600 hover:bg-gray-100"
                    >
                        {isMobileMenuOpen ? (
                            <X className="w-6 h-6" />
                        ) : (
                            <Menu className="w-6 h-6" />
                        )}
                    </Button>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-x-hidden relative">
                    <div className="relative z-10">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <DashboardShell>{children}</DashboardShell>
            </AuthProvider>
        </ThemeProvider>
    );
}

