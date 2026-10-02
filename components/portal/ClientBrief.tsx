"use client";

import { useState, useEffect } from "react";
import { Client } from "@/types/clients";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Save, Upload, Key, Target, HelpCircle, Heart, Users, TrendingUp, Compass, Globe, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function ClientBrief({ client }: { client: Client }) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const supabase = createClient();

    const [identity, setIdentity] = useState<any>({
        purpose: "",
        foundersQuote: "", // We will use this for origin/history
        toneOfVoice: "", // Values / tone
        constraints: "", // Daily life / restrictions
        targetAudience: "",
        competitors: "", // Competitors / references
        postingFrequency: "", // Dreams/Goals mapped here temporarily or we just use purpose
    });

    const [social, setSocial] = useState({
        instagram: "",
        driveLink: "",
        password: ""
    });

    useEffect(() => {
        const fetchIdentity = async () => {
            if (!client?.id || client.id === 'demo') return;
            setLoading(true);
            const { data } = await supabase
                .from("ClientIdentity")
                .select("*")
                .eq("clientId", client.id)
                .single();

            if (data) {
                setIdentity(data);
                // Try to load any custom brief extensions
            }
            setLoading(false);
        };
        fetchIdentity();
    }, [client]);

    const handleSave = async () => {
        if (!client?.id || client.id === 'demo') {
            alert("Modo Demo: No se guardarán los datos.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                purpose: identity.purpose,
                foundersQuote: identity.foundersQuote,
                toneOfVoice: identity.toneOfVoice,
                constraints: identity.constraints,
                targetAudience: identity.targetAudience,
                competitors: identity.competitors,
                postingFrequency: identity.postingFrequency
            };

            const { data: existing } = await supabase
                .from("ClientIdentity")
                .select("id")
                .eq("clientId", client.id)
                .single();

            if (existing) {
                await supabase.from("ClientIdentity").update(payload).eq("clientId", client.id);
            } else {
                await supabase.from("ClientIdentity").insert({ clientId: client.id, ...payload });
            }
            alert("? ¡Brief guardado exitosamente!");
        } catch (error) {
            console.error("Error saving brief", error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-lumen-priority animate-spin" /></div>;

    return (
        <div className="space-y-8 pb-12">
            <div className="bg-gradient-to-br from-[#1A237E] to-blue-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 max-w-2xl">
                    <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-amber-400" />
                        Completar el Brief
                    </h2>
                    <p className="text-blue-100 text-sm leading-relaxed">
                        Este espacio es vital para nosotros. No buscamos solo "gestionar redes", sino darle rostro digital a tu obra o marca. Tómate el tiempo necesario para responder; tus palabras son la semilla con la que trabajaremos tu contenido.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Right Column - Briefing (takes 2 cols) */}
                <div className="md:col-span-2 space-y-6">
                    {/* SECTION 1: Identidad y Misión */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                            <Compass className="w-5 h-5 text-lumen-priority" />
                            1. Identidad y Misión de la Obra
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900">¿Cuál es el origen y la historia de tu marca/institución?</label>
                                <p className="text-xs text-gray-500 mb-2">Cuéntanos cómo nació, quiénes fueron los fundadores y qué los motivó a iniciar.</p>
                                <textarea
                                    value={identity.foundersQuote}
                                    onChange={(e) => setIdentity({...identity, foundersQuote: e.target.value})}
                                    placeholder="Hace X años comenzamos porque..."
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900">¿Cuál es la misión principal que guía su labor?</label>
                                <p className="text-xs text-gray-500 mb-2">Más allá de ganar dinero, ¿qué impacto buscan tener en la sociedad?</p>
                                <textarea
                                    value={identity.purpose}
                                    onChange={(e) => setIdentity({...identity, purpose: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900">¿Qué valores fundamentales desean reflejar en redes?</label>
                                <p className="text-xs text-gray-500 mb-2">Ejemplo: Caridad, fe, servicio, innovación, lujo, cercanía, fraternidad...</p>
                                <textarea
                                    value={identity.toneOfVoice}
                                    onChange={(e) => setIdentity({...identity, toneOfVoice: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[80px] resize-none shadow-sm text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 2: Vida, Servicios y Comunidad */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                            <Heart className="w-5 h-5 text-[#00838F]" />
                            2. Servicios y Comunidad
                        </h3>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900">¿Qué aspectos de la vida cotidiana quisieran mostrar en redes?</label>
                                <p className="text-xs text-gray-500 mb-2">El detrás de escena, rostros felices de clientes, actividades recreativas, celebraciones...</p>
                                <textarea
                                    value={identity.constraints}
                                    onChange={(e) => setIdentity({...identity, constraints: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900">¿A quiénes queremos llegar con las redes sociales?</label>
                                <p className="text-xs text-gray-500 mb-2">Familiares, jóvenes voluntarios, benefactores, empresas corporativas, clientes B2B...</p>
                                <textarea
                                    value={identity.targetAudience}
                                    onChange={(e) => setIdentity({...identity, targetAudience: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                                />
                            </div>
                        </div>
                    </div>

                    {/* SECTION 3: Metas */}
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
                            <TrendingUp className="w-5 h-5 text-[#F7931E]" />
                            3. Sueños y Expectativas
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-900">¿Qué tendría que suceder en los próximos 3 meses para que digas: "Valió la pena trabajar con Lumen"?</label>
                            <p className="text-xs text-gray-500 mb-2">Más seguidores, nuevas alianzas, más donaciones/ventas, mayor difusión...</p>
                            <textarea
                                value={identity.postingFrequency}
                                onChange={(e) => setIdentity({...identity, postingFrequency: e.target.value})}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm text-sm"
                            />
                        </div>
                    </div>
                </div>

                {/* Left Column - Visuals & Access */}
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm sticky top-24">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Upload className="w-5 h-5 text-[#1A237E]" />
                            Logos y Accesos
                        </h3>
                        
                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Link a Drive / Assets</label>
                                <p className="text-[10px] text-gray-400 mb-2">Pega aquí el enlace (Google Drive o Canva) con tu logo y fotos. Si no tienes, envíalas por WhatsApp.</p>
                                <input type="url" value={social.driveLink} onChange={e => setSocial({...social, driveLink: e.target.value})} placeholder="https://drive.google.com/..." className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                            </div>

                            <hr className="border-gray-100" />

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Instagram (Usuario)</label>
                                    <input type="text" value={social.instagram} onChange={e => setSocial({...social, instagram: e.target.value})} placeholder="@tu_cuenta" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contraseña</label>
                                    <input type="password" value={social.password} onChange={e => setSocial({...social, password: e.target.value})} placeholder="••••••••" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-lumen-priority outline-none transition-all shadow-sm bg-gray-50/50 text-sm" />
                                    <p className="text-[10px] text-gray-400">Esta información se cifra de forma segura.</p>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button 
                                    onClick={handleSave} 
                                    disabled={saving}
                                    className="w-full bg-[#1A237E] text-white hover:bg-blue-900 transition-all rounded-xl py-6 font-bold shadow-lg shadow-blue-900/20"
                                >
                                    {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
                                    Guardar Perfil
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
