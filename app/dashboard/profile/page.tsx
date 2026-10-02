"use client";

import { useState, useEffect } from "react";
import {
    User, Mail, Shield, Smartphone, Save, Loader2,
    Camera, MapPin, Briefcase, CheckCircle, Edit3,
    Zap, Star, Activity, Lock, Key
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { UserRole, ROLE_LABELS } from "@/types/auth";
import { motion } from "framer-motion";

const ROLE_COLORS: Record<UserRole, string> = {
    admin: "bg-lumen-priority text-white",
    strategist: "bg-blue-600 text-white",
    sales: "bg-green-600 text-white",
    designer: "bg-purple-600 text-white",
    programmer: "bg-indigo-600 text-white",
    community_manager: "bg-pink-600 text-white",
    content_creator: "bg-rose-600 text-white",
    spiritual_companion: "bg-cyan-700 text-white",
};

const ROLE_GRADIENTS: Record<UserRole, string> = {
    admin: "from-orange-500 via-amber-500 to-yellow-400",
    strategist: "from-blue-600 via-blue-500 to-indigo-400",
    sales: "from-green-600 via-emerald-500 to-teal-400",
    designer: "from-purple-600 via-violet-500 to-purple-400",
    programmer: "from-indigo-600 via-blue-500 to-cyan-400",
    community_manager: "from-pink-600 via-rose-500 to-pink-400",
    content_creator: "from-rose-600 via-orange-500 to-amber-400",
    spiritual_companion: "from-cyan-700 via-teal-600 to-cyan-400",
};

export default function ProfilePage() {
    const { user, switchRole, updateProfile } = useAuth();
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeTab, setActiveTab] = useState<"info" | "security" | "preferences">("info");

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        location: "",
        bio: ""
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || "",
                location: user.location || "",
                bio: user.bio || ""
            });
        }
    }, [user]);

    const handleSave = async () => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 700));
        updateProfile(formData);
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    if (!user) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-lumen-priority" />
                <p className="text-gray-500 text-sm">Cargando perfil...</p>
            </div>
        </div>
    );

    const initials = (user.name || "U")
        .split(" ")
        .map((w: string) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const gradient = ROLE_GRADIENTS[user.role] || ROLE_GRADIENTS.admin;
    const roleColor = ROLE_COLORS[user.role] || ROLE_COLORS.admin;

    return (
        <div className="max-w-5xl mx-auto space-y-0">

            {/* ===== HERO CARD — Discord style ===== */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white border border-gray-100 rounded-3xl overflow-hidden shadow-sm"
            >
                {/* Banner gradient */}
                <div className={`h-36 bg-gradient-to-r ${gradient} relative overflow-hidden`}>
                    {/* Decorative circles */}
                    <div className="absolute -right-12 -top-12 w-48 h-48 bg-white/10 rounded-full" />
                    <div className="absolute right-20 -bottom-8 w-32 h-32 bg-white/10 rounded-full" />
                    <div className="absolute left-1/3 top-4 w-20 h-20 bg-white/5 rounded-full" />
                    {/* Pattern */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 30% 70%, white 0%, transparent 50%)' }}
                    />
                    {/* Role tag floating on banner */}
                    <div className="absolute top-4 right-4">
                        <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/30`}>
                            {ROLE_LABELS[user.role]}
                        </span>
                    </div>
                </div>

                {/* Avatar + Info row */}
                <div className="px-8 pb-6 relative">
                    {/* Avatar — overlapping the banner */}
                    <div className="relative -mt-14 mb-4 flex items-end justify-between">
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl font-black text-white shadow-xl border-4 border-white`}>
                                {initials}
                            </div>
                            {/* Online indicator */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                            {/* Camera button */}
                            <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-gray-900 hover:bg-gray-700 rounded-full flex items-center justify-center text-white transition-all opacity-0 hover:opacity-100 group-hover:opacity-100 shadow-md">
                                <Camera className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Save button */}
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={`lumen-btn ${saved ? 'bg-green-500' : 'lumen-btn-primary'} transition-all`}
                        >
                            {isSaving ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : saved ? (
                                <CheckCircle className="w-4 h-4" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            {saved ? '¡Guardado!' : 'Guardar Cambios'}
                        </button>
                    </div>

                    {/* Name + role + location */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                {user.name || "Usuario"}
                            </h2>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${roleColor}`}>
                                    {ROLE_LABELS[user.role]}
                                </span>
                                {user.location && (
                                    <span className="flex items-center gap-1 text-sm text-gray-500">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {user.location}
                                    </span>
                                )}
                                {user.email && (
                                    <span className="flex items-center gap-1 text-sm text-gray-500">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </span>
                                )}
                            </div>
                            {user.bio && (
                                <p className="text-sm text-gray-600 mt-2 max-w-lg leading-relaxed">{user.bio}</p>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="flex gap-6 shrink-0">
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-900">12</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Proyectos</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-gray-900">48</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Tareas</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-2xl font-black text-lumen-priority">3</p>
                                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Clientes</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="border-t border-gray-100 px-8">
                    <div className="flex gap-0">
                        {[
                            { id: "info" as const, label: "Información", icon: User },
                            { id: "security" as const, label: "Seguridad", icon: Lock },
                            { id: "preferences" as const, label: "Preferencias", icon: Zap },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-5 py-4 text-sm font-semibold border-b-2 transition-all ${
                                    activeTab === tab.id
                                        ? "border-lumen-priority text-lumen-priority"
                                        : "border-transparent text-gray-500 hover:text-gray-700"
                                }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ===== TAB CONTENT ===== */}
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="pt-5"
            >
                {/* ── INFO TAB ── */}
                {activeTab === "info" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* Left: role switcher */}
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                            <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-lumen-priority" />
                                Rol del Sistema
                            </h3>
                            <div className={`w-full rounded-xl p-4 bg-gradient-to-br ${gradient} text-white text-center`}>
                                <p className="text-xs font-semibold uppercase tracking-wider opacity-70 mb-1">Rol activo</p>
                                <p className="text-xl font-black">{ROLE_LABELS[user.role]}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wider">Simular rol</p>
                                <div className="space-y-1.5">
                                    {(Object.entries(ROLE_LABELS) as [UserRole, string][]).map(([key, label]) => (
                                        <button
                                            key={key}
                                            onClick={() => switchRole(key)}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                                                user.role === key
                                                    ? `${roleColor} shadow-sm`
                                                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                            }`}
                                        >
                                            <span>{label}</span>
                                            {user.role === key && <CheckCircle className="w-3.5 h-3.5" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right: form */}
                        <div className="md:col-span-2 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-lumen-priority" />
                                Información Personal
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {[
                                    { label: "Nombre Completo", key: "name", type: "text", icon: User },
                                    { label: "Email Corporativo", key: "email", type: "email", icon: Mail },
                                    { label: "Teléfono", key: "phone", type: "tel", icon: Smartphone },
                                    { label: "Ubicación", key: "location", type: "text", icon: MapPin },
                                ].map((field) => (
                                    <div key={field.key} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                            <field.icon className="w-3.5 h-3.5" />
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={formData[field.key as keyof typeof formData]}
                                            onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/10 transition-all outline-none text-gray-900 placeholder-gray-400 text-sm"
                                        />
                                    </div>
                                ))}

                                <div className="md:col-span-2 space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <Activity className="w-3.5 h-3.5" />
                                        Bio
                                    </label>
                                    <textarea
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value.slice(0, 300) })}
                                        placeholder="Cuéntanos sobre ti..."
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/10 transition-all outline-none text-gray-900 placeholder-gray-400 text-sm min-h-[100px] resize-none"
                                    />
                                    <p className="text-xs text-gray-400 text-right">{formData.bio.length}/300 caracteres</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SECURITY TAB ── */}
                {activeTab === "security" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Key className="w-4 h-4 text-lumen-priority" />
                                Contraseña
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Última actualización: hace 30 días</p>
                            <div className="space-y-4">
                                {["Contraseña Actual", "Nueva Contraseña", "Confirmar Contraseña"].map((label) => (
                                    <div key={label} className="space-y-1.5">
                                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/10 transition-all outline-none text-sm"
                                        />
                                    </div>
                                ))}
                                <button className="lumen-btn lumen-btn-primary w-full mt-2">
                                    <Lock className="w-4 h-4" />
                                    Cambiar Contraseña
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-lumen-priority" />
                                Autenticación 2FA
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">Añade una capa extra de seguridad a tu cuenta.</p>

                            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-xl flex items-center justify-center">
                                            <Smartphone className="w-5 h-5 text-gray-500" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">App Autenticadora</p>
                                            <p className="text-xs text-gray-400">Google Authenticator, Authy</p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                                        No activo
                                    </span>
                                </div>
                                <button className="lumen-btn lumen-btn-outline w-full text-sm py-2">
                                    Activar 2FA
                                </button>
                            </div>

                            <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-green-800">Sesión activa</p>
                                    <p className="text-xs text-green-600 mt-0.5">Conectado desde Venezuela · Chrome</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── PREFERENCES TAB ── */}
                {activeTab === "preferences" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-lumen-priority" />
                                Notificaciones
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { label: "Nuevos entregables", desc: "Cuando un cliente sube un archivo", active: true },
                                    { label: "Eventos de calendario", desc: "Recordatorios 24h antes", active: true },
                                    { label: "Aprobaciones pendientes", desc: "Cuando hay contenido por revisar", active: false },
                                    { label: "Resumen semanal", desc: "Reporte cada lunes a las 9am", active: false },
                                ].map((item) => (
                                    <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                                            <p className="text-xs text-gray-400">{item.desc}</p>
                                        </div>
                                        <div className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${item.active ? 'bg-lumen-priority' : 'bg-gray-200'}`}>
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${item.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2">
                                <Star className="w-4 h-4 text-lumen-priority" />
                                Accesos Rápidos
                            </h3>
                            <div className="space-y-2">
                                {[
                                    { label: "Ver mi Hub de Cliente", href: "/dashboard/hub", color: "text-blue-600" },
                                    { label: "Ir al Calendario", href: "/dashboard/calendar", color: "text-purple-600" },
                                    { label: "Revisar Entregables", href: "/dashboard/deliverables", color: "text-green-600" },
                                    { label: "Panel Admin", href: "/dashboard/admin", color: "text-lumen-priority" },
                                ].map((link) => (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                                    >
                                        <span className={`text-sm font-medium ${link.color}`}>{link.label}</span>
                                        <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
