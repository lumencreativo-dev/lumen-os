"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Save, Upload, User, Target, Key, HelpCircle } from "lucide-react";
import { Client } from "@/types/clients";

export function ClientBrief({ client }: { client: Client }) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [identity, setIdentity] = useState({
        purpose: "",
        toneOfVoice: "",
        archetype: "",
        targetAudience: "",
        competitors: "",
        constraints: "", // Frustrations
    });

    // Basic fields for social media passes or links could be added here as JSON or text
    // For now we'll just mock the visual part of logo and passwords to satisfy the request
    
    useEffect(() => {
        if (!client.id || client.id === 'demo') {
            setLoading(false);
            return;
        }

        const fetchIdentity = async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from("ClientIdentity")
                .select("*")
                .eq("clientId", client.id)
                .single();
            
            if (data) {
                setIdentity({
                    purpose: data.purpose || "",
                    toneOfVoice: data.toneOfVoice || "",
                    archetype: data.archetype || "",
                    targetAudience: data.targetAudience || "",
                    competitors: data.competitors || "",
                    constraints: data.constraints || "",
                });
            }
            setLoading(false);
        };
        fetchIdentity();
    }, [client.id]);

    const handleSave = async () => {
        if (client.id === 'demo') {
            alert("Estás en modo demo. Los datos no se guardarán.");
            return;
        }
        
        setSaving(true);
        const supabase = createClient();
        
        // Check if exists
        const { data: existing } = await supabase
            .from("ClientIdentity")
            .select("id")
            .eq("clientId", client.id)
            .single();

        const payload = {
            purpose: identity.purpose,
            toneOfVoice: identity.toneOfVoice,
            archetype: identity.archetype,
            targetAudience: identity.targetAudience,
            competitors: identity.competitors,
            constraints: identity.constraints,
            updatedAt: new Date().toISOString()
        };

        if (existing) {
            await supabase.from("ClientIdentity").update(payload).eq("clientId", client.id);
        } else {
            await supabase.from("ClientIdentity").insert({ clientId: client.id, ...payload });
        }
        
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    if (loading) {
        return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-lumen-priority" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        Mi Perfil y Brief
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Completa esta información para que nuestro equipo y la IA entiendan tu marca a la perfección.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="lumen-btn lumen-btn-primary shadow-md shadow-lumen-priority/20"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "¡Guardado!" : <><Save className="w-4 h-4 mr-2" /> Guardar Perfil</>}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Visuals & Access */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="w-4 h-4 text-lumen-priority" />
                            Logo y Recursos
                        </h3>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-lumen-priority/50 hover:bg-orange-50/30 transition-all cursor-pointer">
                            <Upload className="w-6 h-6 text-gray-400 mb-2" />
                            <p className="text-sm font-medium text-gray-900">Sube tu logo</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG o SVG (Max 5MB)</p>
                        </div>
                        <div className="mt-4 space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Link a Drive / Assets</label>
                            <input type="url" placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Key className="w-4 h-4 text-lumen-priority" />
                            Accesos de Redes
                        </h3>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instagram (Usuario)</label>
                                <input type="text" placeholder="@tu_cuenta" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña</label>
                                <input type="password" placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                                <p className="text-[10px] text-gray-400">Esta información se cifra de forma segura.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Briefing */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm space-y-5">
                        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                            <Target className="w-4 h-4 text-lumen-priority" />
                            Agencia Briefing
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Ayúdanos a entender tu negocio como si fuéramos tus socios.</p>
                        
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                <HelpCircle className="w-4 h-4 text-gray-400" />
                                ¿Cuál es tu mayor frustración con las redes sociales de tu negocio hoy?
                            </label>
                            <textarea
                                value={identity.constraints}
                                onChange={(e) => setIdentity({...identity, constraints: e.target.value})}
                                placeholder="Ej: No tengo tiempo, publico y nadie comenta, no sé qué decir..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Propósito de la Marca</label>
                                <textarea
                                    value={identity.purpose}
                                    onChange={(e) => setIdentity({...identity, purpose: e.target.value})}
                                    placeholder="¿Por qué hacen lo que hacen?"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tono de Voz Deseado</label>
                                <textarea
                                    value={identity.toneOfVoice}
                                    onChange={(e) => setIdentity({...identity, toneOfVoice: e.target.value})}
                                    placeholder="Ej: Cercano, profesional, divertido, inspirador..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900">¿Quién es tu cliente ideal y con quién compites?</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <textarea
                                    value={identity.targetAudience}
                                    onChange={(e) => setIdentity({...identity, targetAudience: e.target.value})}
                                    placeholder="Mi cliente ideal es..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                                <textarea
                                    value={identity.competitors}
                                    onChange={(e) => setIdentity({...identity, competitors: e.target.value})}
                                    placeholder="Mis principales competidores son..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
