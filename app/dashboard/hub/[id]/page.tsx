"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import {
    ArrowLeft, Fingerprint, BookOpen, Calendar, MessageSquare, Save,
    Plus, Trash2, AlertCircle, Phone, X, Check, Hash, Palette, Type,
    Target, UserCircle, ChevronDown, ChevronUp, Edit3, LayoutList,
    Kanban, Grid, Clock, Sparkles, Copy
} from "lucide-react";

// ==================== TOAST NOTIFICATION ====================
function Toast({ message, type, onClose }: { message: string; type: "success" | "error"; onClose: () => void }) {
    useEffect(() => {
        const t = setTimeout(onClose, 3500);
        return () => clearTimeout(t);
    }, [onClose]);

    return (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border transition-all animate-in slide-in-from-top-2 duration-300 ${
            type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
        }`}>
            {type === "success" ? <Check className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
            <span className="text-sm font-medium">{message}</span>
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
        </div>
    );
}

// ==================== TAG INPUT ====================
function TagInput({ tags, onAdd, onRemove, placeholder, color = "gray" }: {
    tags: string[]; onAdd: (tag: string) => void; onRemove: (index: number) => void; placeholder: string; color?: string;
}) {
    const [input, setInput] = useState("");
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.key === "Enter" || e.key === ",") && input.trim()) {
            e.preventDefault();
            onAdd(input.trim());
            setInput("");
        }
    };
    const colorMap: Record<string, string> = {
        gray: "bg-gray-100 text-gray-700", blue: "bg-blue-100 text-blue-700",
        red: "bg-red-100 text-red-700", green: "bg-emerald-100 text-emerald-700",
        purple: "bg-purple-100 text-purple-700",
    };
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, i) => (
                    <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${colorMap[color]}`}>
                        {tag}
                        <button onClick={() => onRemove(i)} className="opacity-50 hover:opacity-100"><X className="w-3 h-3" /></button>
                    </span>
                ))}
            </div>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none"
            />
        </div>
    );
}

// ==================== COLOR PALETTE ====================
function ColorPalette({ colors, onAdd, onRemove }: { colors: string[]; onAdd: (hex: string) => void; onRemove: (index: number) => void; }) {
    const [hex, setHex] = useState("#");
    const addColor = () => { if (/^#[0-9A-Fa-f]{6}$/.test(hex)) { onAdd(hex.toUpperCase()); setHex("#"); } };
    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-3">
                {colors.map((c, i) => (
                    <div key={i} className="group relative">
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md cursor-pointer" style={{ backgroundColor: c }} title={c} />
                        <button onClick={() => onRemove(i)} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-2.5 h-2.5" /></button>
                        <span className="text-[9px] text-gray-400 text-center block mt-1 font-mono">{c}</span>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
                <input type="color" value={hex.length === 7 ? hex : "#000000"} onChange={(e) => setHex(e.target.value.toUpperCase())} className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <input type="text" value={hex} onChange={(e) => setHex(e.target.value)} placeholder="#FF5733" className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-lumen-priority/20" maxLength={7} />
                <button onClick={addColor} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-xl hover:bg-gray-700"><Plus className="w-4 h-4" /></button>
            </div>
        </div>
    );
}

// ==================== PROGRESS BAR ====================
function CompletionBar({ percentage }: { percentage: number }) {
    const color = percentage < 30 ? "bg-red-400" : percentage < 70 ? "bg-amber-400" : "bg-emerald-400";
    return (
        <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${percentage}%` }} />
            </div>
            <span className={`text-xs font-bold ${percentage < 30 ? "text-red-500" : percentage < 70 ? "text-amber-500" : "text-emerald-500"}`}>{percentage}%</span>
        </div>
    );
}

const inputClass = "w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-lumen-priority/20 focus:border-lumen-priority outline-none transition-colors";

// ==================== MAIN PAGE ====================
export default function ClientHubPage() {
    const params = useParams();
    const router = useRouter();
    const clientId = params.id as string;

    const [activeTab, setActiveTab] = useState("identidad");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const isInitialLoad = useRef(true);
    const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);

    // Edit states
    const [isEditingId, setIsEditingId] = useState(false);
    const [isEditingContact, setIsEditingContact] = useState(false);

    // Data states
    const [client, setClient] = useState<any>(null);
    const [identity, setIdentity] = useState<any>({
        purpose: "", archetype: "", toneOfVoice: "", constraints: "", foundersQuote: "",
        targetAudience: "", contentPillars: "[]", brandColors: "[]", typography: "",
        fixedHashtags: "[]", bannedHashtags: "[]", competitors: "", postingFrequency: ""
    });
    const [contactInfo, setContactInfo] = useState<any>({
        contactName: "", contactPhone: "", preferredSchedule: "", communicationNotes: ""
    });
    const [preferences, setPreferences] = useState<any[]>([]);
    const [newPref, setNewPref] = useState({ rule: "", category: "DISEÑO", isStrict: false, context: "" });
    const [adnSection, setAdnSection] = useState({ esencia: true, audiencia: true, visual: true });

    // Calendar states
    const [events, setEvents] = useState<any[]>([]);
    const [calendarView, setCalendarView] = useState<'kanban' | 'agenda' | 'grid'>('kanban');
    const [showEventForm, setShowEventForm] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "POST IG", status: "BORRADOR" });
    const [currentGridDate, setCurrentGridDate] = useState(new Date());
    const [editingEvent, setEditingEvent] = useState<any>(null);
    const [copiedPrompt, setCopiedPrompt] = useState<number | null>(null);
    const [editingPromptIdx, setEditingPromptIdx] = useState<number | null>(null);
    const [customPromptText, setCustomPromptText] = useState<Record<number, string>>({});

    const parseJSON = (str: string | null | undefined): string[] => {
        if (!str) return [];
        try { return JSON.parse(str); } catch { return []; }
    };

    const calculateCompletion = useCallback(() => {
        const fields = [identity.purpose, identity.toneOfVoice, identity.archetype, identity.foundersQuote, identity.constraints, identity.targetAudience, identity.typography, identity.competitors, identity.postingFrequency];
        const jsonFields = [identity.contentPillars, identity.brandColors, identity.fixedHashtags];
        const textFilled = fields.filter(f => f && f.trim() !== "").length;
        const jsonFilled = jsonFields.filter(f => parseJSON(f).length > 0).length;
        const contactFilled = [contactInfo.contactName, contactInfo.contactPhone].filter(f => f && f.trim() !== "").length;
        return Math.round(((textFilled + jsonFilled + contactFilled) / (fields.length + jsonFields.length + 2)) * 100);
    }, [identity, contactInfo]);

    // ==================== FETCH DATA ====================
    useEffect(() => {
        async function fetchData() {
            const supabase = createClient();
            const { data: clientData } = await supabase.from("Client").select("*").eq("id", clientId).single();
            if (!clientData) { router.push("/dashboard/hub"); return; }
            setClient(clientData);
            setContactInfo({ contactName: clientData.contactName || "", contactPhone: clientData.contactPhone || "", preferredSchedule: clientData.preferredSchedule || "", communicationNotes: clientData.communicationNotes || "" });
            if (!clientData.contactName && !clientData.contactPhone) setIsEditingContact(true);

            const { data: idData } = await supabase.from("ClientIdentity").select("*").eq("clientId", clientId).single();
            if (idData) {
                setIdentity({ ...idData, contentPillars: idData.contentPillars || "[]", brandColors: idData.brandColors || "[]", fixedHashtags: idData.fixedHashtags || "[]", bannedHashtags: idData.bannedHashtags || "[]" });
            } else { setIsEditingId(true); }

            const { data: prefData } = await supabase.from("StylePreference").select("*").eq("clientId", clientId).order("createdAt", { ascending: false });
            if (prefData) setPreferences(prefData);

            // Fetch Calendar Events
            const { data: eventsData } = await supabase.from("CalendarEvent").select("*").eq("clientId", clientId).order("date", { ascending: true });
            if (eventsData) setEvents(eventsData);

            setLoading(false);
            setTimeout(() => { isInitialLoad.current = false; }, 500);
        }
        fetchData();
    }, [clientId, router]);

    // ==================== SAVE ====================
    useEffect(() => {
        if (isInitialLoad.current || !isEditingId) return;
        if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = setTimeout(() => { saveIdentity(true); }, 3000);
        return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [identity, isEditingId]);

    const saveIdentity = async (isAuto = false) => {
        if (!isAuto) setSaving(true);
        const supabase = createClient();
        const payload = { ...identity, updatedAt: new Date().toISOString() };
        delete payload.id; delete payload.clientId; delete payload.createdAt;

        const { data: existing } = await supabase.from("ClientIdentity").select("id").eq("clientId", clientId).single();
        let saveError = null;

        if (existing) {
            const { error } = await supabase.from("ClientIdentity").update(payload).eq("clientId", clientId);
            saveError = error;
        } else {
            const { error } = await supabase.from("ClientIdentity").insert({ clientId, ...payload });
            saveError = error;
        }

        if (!isAuto) { setSaving(false); if (!saveError) setIsEditingId(false); }
        if (saveError) {
            if (!isAuto) setToast({ message: "Error al guardar", type: "error" });
        } else {
            setLastSaved(new Date());
            if (!isAuto) setToast({ message: "Identidad guardada con éxito", type: "success" });
        }
    };

    const saveContact = async () => {
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from("Client").update(contactInfo).eq("id", clientId);
        setSaving(false);
        if (error) setToast({ message: "Error al guardar contacto", type: "error" });
        else { setIsEditingContact(false); setToast({ message: "Contacto guardado", type: "success" }); }
    };

    const addPreference = async () => {
        if (!newPref.rule) return;
        setSaving(true);
        const supabase = createClient();
        const payload = { clientId, rule: newPref.rule, category: newPref.category, isStrict: newPref.isStrict, context: newPref.context };
        const { data, error } = await supabase.from("StylePreference").insert(payload).select().single();
        setSaving(false);
        if (data) {
            setPreferences([data, ...preferences]);
            setNewPref({ rule: "", category: "DISEÑO", isStrict: false, context: "" });
            setToast({ message: "Preferencia guardada", type: "success" });
        } else {
            setToast({ message: "Error al guardar preferencia", type: "error" });
        }
    };

    const deletePreference = async (prefId: string) => {
        if (!window.confirm("¿Seguro que deseas eliminar este criterio?")) return;
        setSaving(true);
        const supabase = createClient();
        const { error } = await supabase.from("StylePreference").delete().eq("id", prefId);
        setSaving(false);
        if (!error) {
            setPreferences(preferences.filter(p => p.id !== prefId));
            setToast({ message: "Criterio eliminado", type: "success" });
        } else {
            setToast({ message: "Error al eliminar criterio", type: "error" });
        }
    };

    // ==================== CALENDAR FUNCTIONS ====================
    const addCalendarEvent = async () => {
        if (!newEvent.title || !newEvent.date) return;
        setSaving(true);
        const supabase = createClient();
        const { data, error } = await supabase.from("CalendarEvent").insert({
            clientId, title: newEvent.title, date: new Date(newEvent.date).toISOString(),
            type: newEvent.type, status: newEvent.status, layer: "CONTENT"
        }).select().single();
        
        setSaving(false);
        if (error) {
            console.error("Calendar insert error:", error);
            setToast({ message: "Error: " + (error.message || error.code || "Fallo al guardar evento"), type: "error" });
        } else if (data) {
            setEvents([...events, data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setShowEventForm(false);
            setNewEvent({ title: "", date: "", type: "POST IG", status: "BORRADOR" });
            setToast({ message: "Evento agregado al calendario", type: "success" });
        }
    };

    const deleteCalendarEvent = async (id: string) => {
        const supabase = createClient();
        await supabase.from("CalendarEvent").delete().eq("id", id);
        setEvents(events.filter(e => e.id !== id));
    };

    const startEditEvent = (ev: any) => {
        const d = new Date(ev.date);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        setEditingEvent({ ...ev, date: dateStr });
        setShowEventForm(false);
    };

    const updateCalendarEvent = async () => {
        if (!editingEvent || !editingEvent.title || !editingEvent.date) return;
        setSaving(true);
        const supabase = createClient();
        const { data, error } = await supabase.from("CalendarEvent").update({
            title: editingEvent.title, date: new Date(editingEvent.date).toISOString(),
            type: editingEvent.type, status: editingEvent.status
        }).eq("id", editingEvent.id).select().single();

        setSaving(false);
        if (error) {
            setToast({ message: "Error: " + (error.message || "Fallo al actualizar"), type: "error" });
        } else if (data) {
            setEvents(events.map(e => e.id === data.id ? data : e).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
            setEditingEvent(null);
            setToast({ message: "Evento actualizado", type: "success" });
        }
    };

    const getEventColor = (type: string) => {
        if (type.includes("POST")) return "bg-blue-100 text-blue-700 border-blue-200";
        if (type.includes("REEL") || type.includes("VIDEO")) return "bg-purple-100 text-purple-700 border-purple-200";
        if (type.includes("STORY")) return "bg-pink-100 text-pink-700 border-pink-200";
        if (type.includes("EMAIL")) return "bg-amber-100 text-amber-700 border-amber-200";
        return "bg-gray-100 text-gray-700 border-gray-200";
    };

    // Calendar logic
    const today = new Date();
    today.setHours(0,0,0,0);

    const timeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 60) return "hace un momento";
        return `hace ${Math.floor(seconds / 60)} min`;
    };

    const DataView = ({ label, value, emptyMsg = "No especificado" }: { label: string, value: string | undefined, emptyMsg?: string }) => (
        <div className="mb-4">
            <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</h4>
            {value ? <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{value}</p> : <p className="text-sm text-gray-400 italic">{emptyMsg}</p>}
        </div>
    );

    const TagsView = ({ tags, color = "gray" }: { tags: string[], color?: string }) => {
        if (!tags || tags.length === 0) return <p className="text-sm text-gray-400 italic">No especificado</p>;
        const colorMap: Record<string, string> = { gray: "bg-gray-100 text-gray-700", blue: "bg-blue-100 text-blue-700", red: "bg-red-100 text-red-700", green: "bg-emerald-100 text-emerald-700", purple: "bg-purple-100 text-purple-700" };
        return <div className="flex flex-wrap gap-2">{tags.map((tag, i) => <span key={i} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${colorMap[color]}`}>{tag}</span>)}</div>;
    };

    if (loading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-b-2 border-lumen-priority rounded-full"></div></div>;

    // Calendar categorizations
    const upcomingEvents = events.filter(e => new Date(e.date) >= today);
    const pastEvents = events.filter(e => new Date(e.date) < today);

    const kanbanCols = [
        { title: "Esta Semana", items: upcomingEvents.filter(e => (new Date(e.date).getTime() - today.getTime()) / (1000*3600*24) <= 7) },
        { title: "Días 8-15", items: upcomingEvents.filter(e => { const d = (new Date(e.date).getTime() - today.getTime()) / (1000*3600*24); return d > 7 && d <= 15; }) },
        { title: "Próximo Mes (Días 16-45)", items: upcomingEvents.filter(e => { const d = (new Date(e.date).getTime() - today.getTime()) / (1000*3600*24); return d > 15 && d <= 45; }) }
    ];

    // Grid calculations
    const getDaysArray = () => {
        const year = currentGridDate.getFullYear();
        const month = currentGridDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const array = [];
        for (let i = 0; i < firstDay; i++) array.push(null);
        for (let i = 1; i <= daysInMonth; i++) array.push(new Date(year, month, i));
        return array;
    };

    const prevMonth = () => setCurrentGridDate(new Date(currentGridDate.getFullYear(), currentGridDate.getMonth() - 1, 1));
    const nextMonth = () => setCurrentGridDate(new Date(currentGridDate.getFullYear(), currentGridDate.getMonth() + 1, 1));
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <div className="flex items-start gap-4 border-b border-gray-200 pb-6">
                <Link href="/dashboard/hub" className="p-2 hover:bg-gray-100 rounded-lg transition-colors mt-1"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
                <div className="flex-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">{client.name} <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-md font-mono font-normal">Hub Operativo</span></h1>
                            <p className="text-sm text-gray-500 mt-1">Centro de comando de la marca.</p>
                        </div>
                        <div className="text-right">{lastSaved && <p className="text-[11px] text-gray-400 mb-1">Guardado {timeAgo(lastSaved)}</p>}</div>
                    </div>
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-1"><span className="text-[11px] font-bold text-gray-400 tracking-wider uppercase">Perfil completado</span></div>
                        <CompletionBar percentage={calculateCompletion()} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100/50 p-1 rounded-xl overflow-x-auto">
                {[{ id: "identidad", label: "ADN de Marca", icon: Fingerprint }, { id: "criterios", label: "Criterios", icon: BookOpen }, { id: "contacto", label: "Contacto", icon: Phone }, { id: "calendario", label: "Calendario (T-45)", icon: Calendar }, { id: "prompts", label: "Prompts", icon: MessageSquare }].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-1 items-center justify-center gap-2 py-2.5 px-3 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-lumen-priority shadow-sm" : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                        <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-lumen-priority" : "text-gray-400"}`} />{tab.label}
                    </button>
                ))}
            </div>

            {/* TAB: IDENTIDAD */}
            {activeTab === "identidad" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Perfil Profundo de la Marca</h2>
                            <p className="text-sm text-gray-500">Documento base para todo el equipo creativo.</p>
                        </div>
                        {isEditingId ? (
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditingId(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">Cancelar</button>
                                <button onClick={() => saveIdentity(false)} disabled={saving} className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors disabled:opacity-50"><Save className="w-4 h-4" /> {saving ? "Guardando..." : "Guardar Cambios"}</button>
                            </div>
                        ) : (
                            <button onClick={() => setIsEditingId(true)} className="flex items-center gap-2 px-5 py-2 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm"><Edit3 className="w-4 h-4" /> Editar Identidad</button>
                        )}
                    </div>

                    {!isEditingId ? (
                        <div className="grid grid-cols-1 gap-6">
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><Fingerprint className="w-5 h-5 text-purple-600" /> Esencia</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    {identity.foundersQuote && (
                                        <div className="col-span-1 md:col-span-2 bg-purple-50/50 p-6 rounded-2xl border border-purple-100">
                                            <p className="text-xl font-serif italic text-purple-900">&quot;{identity.foundersQuote}&quot;</p>
                                            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mt-3 block">Cita Fundacional / Lema</span>
                                        </div>
                                    )}
                                    <DataView label="Propósito Superior" value={identity.purpose} />
                                    <DataView label="Arquetipo de Marca" value={identity.archetype} />
                                    <DataView label="Tono de Voz" value={identity.toneOfVoice} />
                                    <DataView label="Restricciones Universales" value={identity.constraints} />
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><Target className="w-5 h-5 text-blue-600" /> Audiencia y Estrategia</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div className="md:col-span-2"><DataView label="Público Objetivo / Buyer Persona" value={identity.targetAudience} /></div>
                                    <div><h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Pilares de Contenido</h4><TagsView tags={parseJSON(identity.contentPillars)} color="blue" /></div>
                                    <DataView label="Frecuencia de Publicación" value={identity.postingFrequency} />
                                    <div className="md:col-span-2"><DataView label="Referentes / Competencia" value={identity.competitors} /></div>
                                </div>
                            </div>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-pink-500"></div>
                                <h3 className="text-base font-bold text-gray-900 mb-6 flex items-center gap-2"><Palette className="w-5 h-5 text-pink-600" /> Identidad Visual</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                                    <div>
                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Paleta de Colores</h4>
                                        {parseJSON(identity.brandColors).length > 0 ? (
                                            <div className="flex gap-3">
                                                {parseJSON(identity.brandColors).map((c: string, i: number) => (
                                                    <div key={i} className="flex flex-col items-center group">
                                                        <div className="w-14 h-14 rounded-full shadow-sm border border-gray-200 transform transition-transform group-hover:scale-110" style={{ backgroundColor: c }} title={c}></div>
                                                        <span className="text-[11px] text-gray-500 font-mono mt-2">{c}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-sm text-gray-400 italic">No especificado</p>}
                                    </div>
                                    <DataView label="Tipografías" value={identity.typography} />
                                    <div><h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hashtags Fijos</h4><TagsView tags={parseJSON(identity.fixedHashtags)} color="green" /></div>
                                    <div><h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Hashtags Prohibidos</h4><TagsView tags={parseJSON(identity.bannedHashtags)} color="red" /></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Esencia Form */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <button onClick={() => setAdnSection({ ...adnSection, esencia: !adnSection.esencia })} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center"><Fingerprint className="w-4 h-4 text-purple-600" /></div><h2 className="text-base font-bold text-gray-900">Esencia de la Marca</h2></div>
                                    {adnSection.esencia ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>
                                {adnSection.esencia && (
                                    <div className="px-5 pb-6 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Propósito Superior</label><textarea value={identity.purpose || ""} onChange={(e) => setIdentity({ ...identity, purpose: e.target.value })} className={`${inputClass} min-h-[100px]`} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Tono de Voz</label><textarea value={identity.toneOfVoice || ""} onChange={(e) => setIdentity({ ...identity, toneOfVoice: e.target.value })} className={`${inputClass} min-h-[100px]`} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Arquetipo de Marca</label><input type="text" value={identity.archetype || ""} onChange={(e) => setIdentity({ ...identity, archetype: e.target.value })} className={inputClass} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Cita Fundacional</label><input type="text" value={identity.foundersQuote || ""} onChange={(e) => setIdentity({ ...identity, foundersQuote: e.target.value })} className={inputClass} /></div>
                                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-gray-700">Restricciones Universales</label><textarea value={identity.constraints || ""} onChange={(e) => setIdentity({ ...identity, constraints: e.target.value })} className={`${inputClass} min-h-[80px]`} /></div>
                                    </div>
                                )}
                            </div>
                            {/* Audiencia Form */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <button onClick={() => setAdnSection({ ...adnSection, audiencia: !adnSection.audiencia })} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center"><Target className="w-4 h-4 text-blue-600" /></div><h2 className="text-base font-bold text-gray-900">Audiencia y Estrategia</h2></div>
                                    {adnSection.audiencia ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>
                                {adnSection.audiencia && (
                                    <div className="px-5 pb-6 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
                                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-gray-700">Público Objetivo</label><textarea value={identity.targetAudience || ""} onChange={(e) => setIdentity({ ...identity, targetAudience: e.target.value })} className={`${inputClass} min-h-[80px]`} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Pilares de Contenido</label><TagInput tags={parseJSON(identity.contentPillars)} placeholder="Ej: Fe práctica..." color="blue" onAdd={(tag) => setIdentity({ ...identity, contentPillars: JSON.stringify([...parseJSON(identity.contentPillars), tag]) })} onRemove={(i) => { const arr = parseJSON(identity.contentPillars); arr.splice(i, 1); setIdentity({ ...identity, contentPillars: JSON.stringify(arr) }); }} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Referentes / Competencia</label><textarea value={identity.competitors || ""} onChange={(e) => setIdentity({ ...identity, competitors: e.target.value })} className={`${inputClass} min-h-[80px]`} /></div>
                                        <div className="space-y-1.5 md:col-span-2"><label className="text-sm font-bold text-gray-700">Frecuencia de Publicación</label><input type="text" value={identity.postingFrequency || ""} onChange={(e) => setIdentity({ ...identity, postingFrequency: e.target.value })} className={inputClass} /></div>
                                    </div>
                                )}
                            </div>
                            {/* Visual Form */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <button onClick={() => setAdnSection({ ...adnSection, visual: !adnSection.visual })} className="w-full flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3"><div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center"><Palette className="w-4 h-4 text-pink-600" /></div><h2 className="text-base font-bold text-gray-900">Identidad Visual</h2></div>
                                    {adnSection.visual ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                                </button>
                                {adnSection.visual && (
                                    <div className="px-5 pb-6 grid grid-cols-1 md:grid-cols-2 gap-5 border-t border-gray-100 pt-5">
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Paleta de Colores</label><ColorPalette colors={parseJSON(identity.brandColors)} onAdd={(hex) => setIdentity({ ...identity, brandColors: JSON.stringify([...parseJSON(identity.brandColors), hex]) })} onRemove={(i) => { const arr = parseJSON(identity.brandColors); arr.splice(i, 1); setIdentity({ ...identity, brandColors: JSON.stringify(arr) }); }} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Tipografías</label><textarea value={identity.typography || ""} onChange={(e) => setIdentity({ ...identity, typography: e.target.value })} className={`${inputClass} min-h-[100px]`} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Hashtags Fijos</label><TagInput tags={parseJSON(identity.fixedHashtags)} placeholder="#MiMarca" color="green" onAdd={(tag) => setIdentity({ ...identity, fixedHashtags: JSON.stringify([...parseJSON(identity.fixedHashtags), tag.startsWith("#") ? tag : "#" + tag]) })} onRemove={(i) => { const arr = parseJSON(identity.fixedHashtags); arr.splice(i, 1); setIdentity({ ...identity, fixedHashtags: JSON.stringify(arr) }); }} /></div>
                                        <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Hashtags Prohibidos</label><TagInput tags={parseJSON(identity.bannedHashtags)} placeholder="#Prohibido" color="red" onAdd={(tag) => setIdentity({ ...identity, bannedHashtags: JSON.stringify([...parseJSON(identity.bannedHashtags), tag.startsWith("#") ? tag : "#" + tag]) })} onRemove={(i) => { const arr = parseJSON(identity.bannedHashtags); arr.splice(i, 1); setIdentity({ ...identity, bannedHashtags: JSON.stringify(arr) }); }} /></div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* TAB: CRITERIOS */}
            {activeTab === "criterios" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Bitácora Dinámica de Criterios</h2>
                            <p className="text-sm text-gray-500">Reglas históricas aprendidas con el cliente.</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 space-y-3">
                            <div className="flex flex-col md:flex-row gap-3">
                                <input type="text" value={newPref.rule} onChange={(e) => setNewPref({ ...newPref, rule: e.target.value })} placeholder="Escribe un criterio aprendido..." className="flex-1 p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20" onKeyDown={(e) => { if (e.key === "Enter") addPreference(); }} />
                                <select value={newPref.category} onChange={(e) => setNewPref({ ...newPref, category: e.target.value })} className="p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none">
                                    {["DISEÑO", "COPYWRITING", "FOTOGRAFÍA", "ESTRATEGIA", "VIDEO", "AUDIO", "REDES_SOCIALES", "BRANDING"].map(o => <option key={o} value={o}>{o.replace("_", " ")}</option>)}
                                </select>
                                <label className="flex items-center gap-2 text-sm text-gray-600 bg-white border border-gray-200 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={newPref.isStrict} onChange={(e) => setNewPref({ ...newPref, isStrict: e.target.checked })} className="rounded text-red-500 focus:ring-red-500" /><span className={newPref.isStrict ? "text-red-600 font-bold" : ""}>Inquebrantable</span></label>
                            </div>
                            <input type="text" value={newPref.context} onChange={(e) => setNewPref({ ...newPref, context: e.target.value })} placeholder="Contexto / Fuente (Ej: 'El cliente lo mencionó en reunión')" className="w-full p-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-lumen-priority/20" />
                            <div className="flex justify-end"><button onClick={addPreference} className="px-4 py-2.5 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 flex items-center gap-2"><Plus className="w-4 h-4" /> Agregar Criterio</button></div>
                        </div>
                        {preferences.length === 0 ? (
                            <div className="text-center py-10 text-gray-400"><BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" /><p>Aún no hay criterios.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {preferences.map((pref) => (
                                    <div key={pref.id} className={`flex items-start justify-between p-4 rounded-xl border ${pref.isStrict ? "bg-red-50/30 border-red-100" : "bg-white border-gray-100"} hover:border-gray-200 transition-colors group`}>
                                        <div className="flex gap-3">
                                            {pref.isStrict ? <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /> : <div className="w-5 h-5 rounded-full bg-gray-100 shrink-0 mt-0.5 flex items-center justify-center"><span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span></div>}
                                            <div>
                                                <p className={`text-sm ${pref.isStrict ? "font-medium text-gray-900" : "text-gray-700"}`}>{pref.rule}</p>
                                                {pref.context && <p className="text-xs text-gray-400 mt-1 italic">&quot;{pref.context}&quot;</p>}
                                                <div className="flex items-center gap-3 mt-1.5">
                                                    <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">{pref.category?.replace("_", " ")}</span>
                                                    {pref.createdAt && (
                                                        <span className="text-[10px] text-gray-400">
                                                            • Registrado el {new Date(pref.createdAt).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => deletePreference(pref.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CONTACTO */}
            {activeTab === "contacto" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3"><div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center"><UserCircle className="w-5 h-5 text-blue-600" /></div><div><h2 className="text-lg font-bold text-gray-900">Datos de Contacto</h2></div></div>
                            {isEditingContact ? (
                                <div className="flex gap-2"><button onClick={() => setIsEditingContact(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200">Cancelar</button><button onClick={saveContact} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800"><Save className="w-4 h-4" /> Guardar</button></div>
                            ) : (
                                <button onClick={() => setIsEditingContact(true)} className="flex items-center gap-2 px-5 py-2.5 bg-black text-white text-sm font-medium rounded-xl hover:bg-gray-800"><Edit3 className="w-4 h-4" /> Editar</button>
                            )}
                        </div>
                        {!isEditingContact ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                                <DataView label="Nombre del Contacto Principal" value={contactInfo.contactName} />
                                <DataView label="Teléfono / WhatsApp" value={contactInfo.contactPhone} />
                                <DataView label="Horario Preferido" value={contactInfo.preferredSchedule} />
                                <DataView label="Notas de Comunicación" value={contactInfo.communicationNotes} />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Nombre</label><input type="text" value={contactInfo.contactName} onChange={(e) => setContactInfo({ ...contactInfo, contactName: e.target.value })} className={inputClass} /></div>
                                <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Teléfono</label><input type="text" value={contactInfo.contactPhone} onChange={(e) => setContactInfo({ ...contactInfo, contactPhone: e.target.value })} className={inputClass} /></div>
                                <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Horario</label><input type="text" value={contactInfo.preferredSchedule} onChange={(e) => setContactInfo({ ...contactInfo, preferredSchedule: e.target.value })} className={inputClass} /></div>
                                <div className="space-y-1.5"><label className="text-sm font-bold text-gray-700">Notas</label><textarea value={contactInfo.communicationNotes} onChange={(e) => setContactInfo({ ...contactInfo, communicationNotes: e.target.value })} className={`${inputClass} min-h-[80px]`} /></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: CALENDARIO T-45 */}
            {activeTab === "calendario" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Calendar className="w-5 h-5 text-lumen-priority" /> Matriz T-45</h2>
                                <p className="text-sm text-gray-500">Planificación de contenido y eventos de la marca.</p>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* View switcher */}
                                <div className="flex bg-gray-100 p-1 rounded-lg">
                                    <button onClick={() => setCalendarView('kanban')} className={`p-2 rounded-md transition-colors ${calendarView === 'kanban' ? 'bg-white shadow-sm text-lumen-priority' : 'text-gray-500 hover:text-gray-900'}`} title="Vista Kanban"><Kanban className="w-4 h-4" /></button>
                                    <button onClick={() => setCalendarView('agenda')} className={`p-2 rounded-md transition-colors ${calendarView === 'agenda' ? 'bg-white shadow-sm text-lumen-priority' : 'text-gray-500 hover:text-gray-900'}`} title="Vista Agenda"><LayoutList className="w-4 h-4" /></button>
                                    <button onClick={() => setCalendarView('grid')} className={`p-2 rounded-md transition-colors ${calendarView === 'grid' ? 'bg-white shadow-sm text-lumen-priority' : 'text-gray-500 hover:text-gray-900'}`} title="Vista Mes"><Grid className="w-4 h-4" /></button>
                                </div>
                                <button onClick={() => setShowEventForm(!showEventForm)} className="flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800">
                                    {showEventForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />} {showEventForm ? "Cerrar" : "Nuevo Evento"}
                                </button>
                            </div>
                        </div>

                        {/* Add Event Form */}
                        {showEventForm && (
                            <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 mb-6 animate-in fade-in slide-in-from-top-2">
                                <h3 className="text-sm font-bold text-gray-900 mb-3">Agregar Evento / Publicación</h3>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Título</label>
                                        <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Ej: Lanzamiento campaña verano" className="w-full p-2.5 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha</label>
                                        <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Formato</label>
                                        <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                                            <option>POST IG</option><option>REEL</option><option>STORY</option><option>TIKTOK</option><option>EMAIL</option><option>EVENTO FÍSICO</option><option>OTRO</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end">
                                    <button onClick={addCalendarEvent} disabled={saving} className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">Guardar Evento</button>
                                </div>
                            </div>
                        )}

                        {/* Edit Event Form */}
                        {editingEvent && (
                            <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 mb-6 animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Editando Evento</h3>
                                    <button onClick={() => setEditingEvent(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Título</label>
                                        <input type="text" value={editingEvent.title} onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Fecha</label>
                                        <input type="date" value={editingEvent.date} onChange={(e) => setEditingEvent({ ...editingEvent, date: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 mb-1 block">Formato</label>
                                        <select value={editingEvent.type || "POST IG"} onChange={(e) => setEditingEvent({ ...editingEvent, type: e.target.value })} className="w-full p-2.5 border rounded-lg text-sm">
                                            <option>POST IG</option><option>REEL</option><option>STORY</option><option>TIKTOK</option><option>EMAIL</option><option>EVENTO FÍSICO</option><option>OTRO</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => setEditingEvent(null)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-200">Cancelar</button>
                                    <button onClick={updateCalendarEvent} disabled={saving} className="px-5 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors">{saving ? "Guardando..." : "Actualizar Evento"}</button>
                                </div>
                            </div>
                        )}

                        {/* VIEWS */}
                        {events.length === 0 && !showEventForm ? (
                            <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-xl">
                                <Calendar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
                                <h3 className="text-gray-900 font-medium">No hay eventos planificados</h3>
                                <p className="text-gray-500 text-sm mt-1">El calendario T-45 está vacío. Agrega el primer evento.</p>
                                <button onClick={() => setShowEventForm(true)} className="mt-4 text-lumen-priority font-medium text-sm hover:underline">Planificar contenido</button>
                            </div>
                        ) : (
                            <div className="mt-6">
                                {/* KANBAN VIEW */}
                                {calendarView === 'kanban' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {kanbanCols.map((col, i) => (
                                            <div key={i} className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
                                                <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                                                    {col.title} <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">{col.items.length}</span>
                                                </h3>
                                                <div className="space-y-3">
                                                    {col.items.length === 0 ? <p className="text-xs text-gray-400 italic text-center py-4">Sin eventos</p> : 
                                                        col.items.map(ev => (
                                                            <div key={ev.id} className={`p-3 bg-white rounded-lg border shadow-sm group ${getEventColor(ev.type)}`}>
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider">{ev.type}</span>
                                                                    <button onClick={() => deleteCalendarEvent(ev.id)} className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                                                                </div>
                                                                <h4 className="font-medium text-gray-900 text-sm mb-2">{ev.title}</h4>
                                                                <div className="flex items-center text-xs text-gray-500">
                                                                    <Clock className="w-3 h-3 mr-1" /> {new Date(ev.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                                </div>
                                                            </div>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* AGENDA VIEW */}
                                {calendarView === 'agenda' && (
                                    <div className="max-w-2xl mx-auto space-y-4">
                                        {upcomingEvents.map(ev => (
                                            <div key={ev.id} className="flex items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow group">
                                                <div className="w-20 flex flex-col items-center justify-center border-r border-gray-100 pr-4">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">{new Date(ev.date).toLocaleDateString('es-ES', { month: 'short' })}</span>
                                                    <span className="text-2xl font-black text-gray-800">{new Date(ev.date).getDate()}</span>
                                                </div>
                                                <div className="flex-1 pl-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${getEventColor(ev.type)}`}>{ev.type}</span>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900">{ev.title}</h4>
                                                </div>
                                                <button onClick={() => deleteCalendarEvent(ev.id)} className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 rounded-lg"><Trash2 className="w-5 h-5" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* GRID VIEW */}
                                {calendarView === 'grid' && (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                            <h3 className="text-lg font-bold text-gray-800 capitalize">{monthNames[currentGridDate.getMonth()]} {currentGridDate.getFullYear()}</h3>
                                            <div className="flex gap-2">
                                                <button onClick={prevMonth} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold">&lt;</button>
                                                <button onClick={() => setCurrentGridDate(new Date())} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700">Hoy</button>
                                                <button onClick={nextMonth} className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 font-bold">&gt;</button>
                                            </div>
                                        </div>
                                        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
                                                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                                                    <div key={d} className="py-2 text-center text-xs font-bold text-gray-500 uppercase">{d}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 auto-rows-[100px]">
                                            {getDaysArray().map((day, i) => (
                                                <div key={i} className={`border-b border-r border-gray-100 p-1 relative ${!day ? 'bg-gray-50' : 'bg-white'}`}>
                                                    {day && (
                                                        <>
                                                            <span className={`text-xs font-medium p-1 ${day.getDate() === today.getDate() && day.getMonth() === today.getMonth() && day.getFullYear() === today.getFullYear() ? 'bg-black text-white rounded-full w-6 h-6 flex items-center justify-center' : 'text-gray-500'}`}>
                                                                {day.getDate()}
                                                            </span>
                                                            <div className="mt-1 space-y-1 overflow-y-auto max-h-[60px] no-scrollbar">
                                                                {events.filter(e => {
                                                                    const ed = new Date(e.date);
                                                                    return ed.getDate() === day.getDate() && ed.getMonth() === day.getMonth() && ed.getFullYear() === day.getFullYear();
                                                                }).map(ev => (
                                                                    <div key={ev.id} className={`text-[9px] font-medium truncate px-1.5 py-0.5 rounded border ${getEventColor(ev.type)}`} title={ev.title}>
                                                                        {ev.title}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB: PROMPTS — Laboratorio de IA */}
            {activeTab === "prompts" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    {/* Header */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 flex items-center gap-4" style={{ background: `linear-gradient(135deg, ${client?.brandColor || '#F7931E'}15, transparent)` }}>
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0" style={{ backgroundColor: client?.brandColor || '#F7931E' }}>
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-gray-900">Laboratorio de IA ✦</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Prompts maestros ya cargados con el ADN de <strong>{client?.name}</strong>. Copia y pega directo en Claude o ChatGPT.</p>
                            </div>
                        </div>
                    </div>

                    {/* Prompt Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {[
                            {
                                category: "Diagnóstico",
                                emoji: "🔍",
                                color: "#7C3AED",
                                title: "Diagnóstico de Marca",
                                description: "Auditoría completa del posicionamiento actual de la marca.",
                                generate: () => `Actúa como un consultor senior de branding. Voy a darte información sobre mi marca y necesito un diagnóstico profundo.

DATOS DE LA MARCA:
- Nombre: ${client?.name || "No definido"}
- Industria: ${client?.industry || "No definida"}
- Propósito: ${identity?.purpose || "No definido"}
- Tono de voz: ${identity?.toneOfVoice || "No definido"}
- Arquetipo de marca: ${identity?.archetype || "No definido"}

Por favor entrega:
1. Diagnóstico del posicionamiento actual (fortalezas y brechas)
2. Análisis de coherencia entre propósito, tono y arquetipo
3. 3 recomendaciones estratégicas concretas y accionables
4. Una pregunta clave que la marca debería responder urgentemente`
                            },
                            {
                                category: "Diagnóstico",
                                emoji: "⚔️",
                                color: "#DC2626",
                                title: "Análisis FODA de Marca",
                                description: "Identifica fortalezas, oportunidades, debilidades y amenazas.",
                                generate: () => `Eres un estratega de marketing. Necesito un FODA (SWOT) completo para mi marca.

CONTEXTO:
- Marca: ${client?.name || "No definido"}
- Industria: ${client?.industry || "No definida"}
- Audiencia objetivo: ${identity?.targetAudience || "No definida"}
- Referentes/Competencia: ${identity?.competitors || "No definidos"}
- Propósito: ${identity?.purpose || "No definido"}

Entrega el FODA en formato de tabla clara con al menos 3 puntos por cuadrante. Luego sugiere la estrategia FO (usar fortalezas para aprovechar oportunidades) más poderosa.`
                            },
                            {
                                category: "Audiencia",
                                emoji: "👤",
                                color: "#2563EB",
                                title: "Buyer Persona Detallada",
                                description: "Construye el perfil psicográfico y demográfico del cliente ideal.",
                                generate: () => `Actúa como un experto en investigación de mercado. Crea una Buyer Persona completa y detallada.

DATOS:
- Marca/Empresa: ${client?.name || "No definido"}
- Audiencia descrita: ${identity?.targetAudience || "No definida"}
- Industria: ${client?.industry || "No definida"}
- Pilares de contenido: ${parseJSON(identity?.contentPillars).join(', ') || "No definidos"}

La Buyer Persona debe incluir:
1. Nombre ficticio y perfil demográfico (edad, ubicación, profesión, ingreso)
2. Perfil psicográfico (valores, miedos, frustraciones, sueños)
3. Comportamiento digital (redes favoritas, horas de conexión, tipo de contenido que consume)
4. Objeciones comunes antes de comprar
5. Frase que diría en su cabeza cuando encuentra esta marca`
                            },
                            {
                                category: "Audiencia",
                                emoji: "🧬",
                                color: "#059669",
                                title: "Arquetipos de Marca",
                                description: "Define el arquetipo dominante y cómo expresarlo en contenido.",
                                generate: () => `Eres un experto en branding jungiano y arquetipos de marca. Analiza esta marca:

- Nombre: ${client?.name || "No definido"}
- Propósito: ${identity?.purpose || "No definido"}
- Tono de voz: ${identity?.toneOfVoice || "No definido"}
- Arquetipo actual declarado: ${identity?.archetype || "No definido"}

Necesito:
1. Confirmación o corrección del arquetipo (con justificación)
2. Los 3 valores centrales que definen este arquetipo en esta marca específica
3. Cómo se expresa este arquetipo en: palabras que SÍ usar, palabras que NO usar, estética visual, y tipo de storytelling
4. Un ejemplo real de otra marca con el mismo arquetipo y qué podemos aprender`
                            },
                            {
                                category: "Contenido",
                                emoji: "💡",
                                color: "#D97706",
                                title: "Lluvia de Ideas de Contenido",
                                description: "5 ideas de contenido alineadas con los pilares de la marca.",
                                generate: () => `Actúa como estratega de contenido. Genera 5 ideas de contenido para redes sociales.

CONTEXTO DE LA MARCA:
- Propósito: ${identity?.purpose || "No definido"}
- Tono de voz: ${identity?.toneOfVoice || "No definido"}
- Arquetipo: ${identity?.archetype || "No definido"}
- Audiencia: ${identity?.targetAudience || "No definida"}
- Pilares de contenido: ${parseJSON(identity?.contentPillars).join(', ') || "No definidos"}
- Hashtags prohibidos: ${parseJSON(identity?.bannedHashtags).join(', ') || "Ninguno"}

Entrega en formato tabla con columnas: Tema | Formato | Gancho (Hook) | Pilar que activa
Incluye al menos 1 idea tipo educativo, 1 inspiracional, 1 de entretenimiento.`
                            },
                            {
                                category: "Contenido",
                                emoji: "✍️",
                                color: "#DB2777",
                                title: "Redactor de Post",
                                description: "Caption listo para publicar con el tono exacto de la marca.",
                                generate: () => `Actúa como copywriter profesional. Escribe un caption para redes sociales.

RESTRICCIONES DE VOZ:
- Tono de voz: ${identity?.toneOfVoice || "No definido"}
- Arquetipo: ${identity?.archetype || "No definido"}
- Hashtags fijos al final: ${parseJSON(identity?.fixedHashtags).join(' ') || "No definidos"}
- Restricciones universales: ${identity?.constraints || "Ninguna"}

CRITERIOS APRENDIDOS:
${preferences.map(p => `- ${p.rule} (${p.category})`).join('\n') || "Sin criterios registrados aún."}

Tema del post: [ESCRIBE AQUÍ EL TEMA]

Escribe 3 versiones (corta, media y larga) para que yo elija la mejor.`
                            },
                            {
                                category: "Video",
                                emoji: "🎬",
                                color: "#7C3AED",
                                title: "Guion para Reel / TikTok",
                                description: "Estructura completa: gancho, retención y CTA para video corto.",
                                generate: () => `Escribe un guion para video corto (Reel/TikTok) de máximo 60 segundos.

MARCA: ${client?.name || "No definido"}
Audiencia: ${identity?.targetAudience || "No definida"}
Tono: ${identity?.toneOfVoice || "No definido"}

CRITERIOS DE VIDEO APRENDIDOS:
${preferences.filter(p => p.category === 'VIDEO').map(p => `- ${p.rule}`).join('\n') || "Sin criterios de video aún."}

Estructura OBLIGATORIA:
1. 🪝 GANCHO (0-3 seg): Frase o imagen que para el scroll
2. 📖 CUERPO (4-45 seg): Valor, historia o demostración
3. 📣 CTA (45-60 seg): Llamado a la acción claro y específico

Tema del video: [ESCRIBE AQUÍ EL TEMA]`
                            },
                            {
                                category: "Video",
                                emoji: "📋",
                                color: "#0891B2",
                                title: "Storyboard Visual",
                                description: "Describe escena a escena el contenido visual de un video.",
                                generate: () => `Eres un director creativo. Crea un storyboard textual para un video de marca.

IDENTIDAD VISUAL:
- Colores de marca: ${parseJSON(identity?.brandColors).join(', ') || "No definidos"}
- Tipografías: ${identity?.typography || "No definidas"}
- Tono visual esperado: ${identity?.toneOfVoice || "No definido"}
- Arquetipo: ${identity?.archetype || "No definido"}

Entrega 5-7 escenas con:
- Descripción visual (qué se ve en pantalla)
- Audio/Narración o texto superpuesto
- Duración estimada en segundos
- Emoción que debe despertar

Tema/Objetivo del video: [ESCRIBE AQUÍ]`
                            },
                            {
                                category: "Estrategia",
                                emoji: "📅",
                                color: "#0EA5E9",
                                title: "Plan de Contenido Mensual",
                                description: "Estructura editorial para 4 semanas alineada a los pilares.",
                                generate: () => `Eres un estratega de contenido digital. Crea un plan editorial para 1 mes completo.

MARCA: ${client?.name || "No definido"}
Frecuencia de publicación declarada: ${identity?.postingFrequency || "No definida"}
Pilares de contenido: ${parseJSON(identity?.contentPillars).join(', ') || "No definidos"}
Plataformas activas: Instagram, TikTok (si aplica), LinkedIn (si aplica)

Entrega en tabla semanal con:
Semana | Día | Pilar | Formato | Concepto / Ángulo | Objetivo

Asegúrate de que el plan tenga variedad de formatos y que cada semana tenga coherencia temática.`
                            },
                            {
                                category: "Estrategia",
                                emoji: "📊",
                                color: "#16A34A",
                                title: "Análisis de Resultados",
                                description: "Interpreta métricas y propone ajustes estratégicos.",
                                generate: () => `Actúa como un analista de datos de marketing digital. Voy a darte mis métricas del mes.

CONTEXTO DE LA MARCA:
- Marca: ${client?.name || "No definido"}
- Audiencia objetivo: ${identity?.targetAudience || "No definida"}
- Pilares de contenido: ${parseJSON(identity?.contentPillars).join(', ') || "No definidos"}

[PEGA AQUÍ TUS MÉTRICAS: seguidores, alcance, impresiones, engagement rate, saves, comentarios, posts más y menos exitosos]

Necesito:
1. Análisis de qué tipo de contenido funcionó mejor y por qué
2. Patrones en los horarios o días de mayor engagement
3. 3 hipótesis sobre lo que está pasando con la audiencia
4. Plan de acción para el próximo mes con al menos 3 cambios concretos`
                            },
                            {
                                category: "Creatividad",
                                emoji: "🎭",
                                color: "#EA580C",
                                title: "Campaña Especial / Efeméride",
                                description: "Crea una mini-campaña para una fecha importante o evento especial.",
                                generate: () => `Eres un director creativo. Diseña una mini-campaña de contenido para una fecha especial.

MARCA: ${client?.name || "No definido"}
Tono: ${identity?.toneOfVoice || "No definido"}
Arquetipo: ${identity?.archetype || "No definido"}
Restricciones: ${identity?.constraints || "Ninguna"}

Fecha / Ocasión especial: [ESCRIBE LA FECHA O EVENTO]
Objetivo de la campaña: [¿Qué quieres lograr? Ventas, awareness, engagement]

Entrega:
1. Concepto creativo central (el "gran paraguas" de la campaña)
2. 3-5 piezas de contenido (qué formato, qué dice, qué muestra)
3. Hashtag o eslogan de la campaña
4. Calendario de publicación sugerido (cuándo y en qué orden)`
                            },
                            {
                                category: "Creatividad",
                                emoji: "🤝",
                                color: "#7C3AED",
                                title: "Propuesta de Colaboración",
                                description: "Redacta una propuesta para colaborar con otra marca o influencer.",
                                generate: () => `Actúa como un experto en marketing de influencers y co-marketing. Crea una propuesta de colaboración.

MARCA PROPONENTE:
- Nombre: ${client?.name || "No definido"}
- Propósito: ${identity?.purpose || "No definido"}
- Audiencia: ${identity?.targetAudience || "No definida"}
- Tono: ${identity?.toneOfVoice || "No definido"}

Marca o influencer objetivo de la colaboración: [ESCRIBE QUIÉN ES]
Tipo de colaboración deseada: [Menciones, contenido conjunto, evento, sorteo, etc.]

Redacta el mensaje de propuesta + un brief de la colaboración que incluya:
1. Por qué esta colaboración tiene sentido
2. Qué aporta cada parte
3. Formato del contenido colaborativo
4. Métricas de éxito esperadas`
                            },
                        ].map((prompt, index) => {
                            const currentText = customPromptText[index] ?? prompt.generate();
                            const isEditing = editingPromptIdx === index;
                            
                            return (
                                <div key={index} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all group flex flex-col overflow-hidden">
                                    {/* Card Header with category color */}
                                    <div className="p-4 flex items-start gap-3" style={{ borderLeft: `4px solid ${prompt.color}` }}>
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: `${prompt.color}15` }}>
                                            {prompt.emoji}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: prompt.color }}>{prompt.category}</span>
                                                    <h3 className="font-bold text-gray-900 text-sm leading-tight">{prompt.title}</h3>
                                                </div>
                                                {!isEditing && (
                                                    <button 
                                                        onClick={() => { setEditingPromptIdx(index); setCustomPromptText(prev => ({...prev, [index]: currentText})); }}
                                                        className="text-gray-300 hover:text-lumen-priority transition-colors flex-shrink-0 mt-0.5"
                                                        title="Personalizar prompt"
                                                    >
                                                        <Edit3 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-xs mt-0.5 leading-snug">{prompt.description}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Prompt Preview / Editor */}
                                    <div className="px-4 pb-4 flex-1 flex flex-col">
                                        {isEditing ? (
                                            <textarea 
                                                className="w-full bg-orange-50 p-3 rounded-xl text-[11px] font-mono text-gray-800 border border-orange-200 mb-3 focus:outline-none focus:ring-2 focus:ring-lumen-priority/30 resize-none flex-1"
                                                style={{ minHeight: '160px' }}
                                                value={currentText}
                                                onChange={(e) => setCustomPromptText(prev => ({...prev, [index]: e.target.value}))}
                                            />
                                        ) : (
                                            <div className="bg-gray-50 p-3 rounded-xl text-[11px] font-mono text-gray-500 whitespace-pre-wrap max-h-36 overflow-y-auto mb-3 border border-gray-100 leading-relaxed flex-1">
                                                {currentText.substring(0, 300)}{currentText.length > 300 ? '...' : ''}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-auto">
                                            {isEditing && (
                                                <button
                                                    onClick={() => setEditingPromptIdx(null)}
                                                    className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                                                >
                                                    Listo
                                                </button>
                                            )}
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(currentText);
                                                    setCopiedPrompt(index);
                                                    setTimeout(() => setCopiedPrompt(null), 2000);
                                                    setToast({ message: "✦ Prompt copiado al portapapeles", type: "success" });
                                                    setEditingPromptIdx(null);
                                                }}
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-bold rounded-lg transition-all"
                                                style={{ 
                                                    backgroundColor: copiedPrompt === index ? '#16A34A' : prompt.color,
                                                    color: 'white'
                                                }}
                                            >
                                                {copiedPrompt === index ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedPrompt === index ? "¡Copiado!" : "Copiar Prompt"}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Footer tip */}
                    <div className="text-center py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            Los prompts se actualizan automáticamente cuando editas el ADN de la marca
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
