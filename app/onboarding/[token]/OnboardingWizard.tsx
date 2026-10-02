"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Building2, Target, Users, CalendarDays, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
    initialClient: any;
    initialIdentity: any;
}

export default function OnboardingWizard({ initialClient, initialIdentity }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form states
    const [clientData, setClientData] = useState({
        industry: initialClient.industry || "",
        website: initialClient.website || "",
        contactName: initialClient.contactName || "",
        contactPhone: initialClient.contactPhone || "",
    });

    const [identityData, setIdentityData] = useState({
        purpose: initialIdentity?.purpose || "",
        toneOfVoice: initialIdentity?.toneOfVoice || "",
        archetype: initialIdentity?.archetype || "",
        targetAudience: initialIdentity?.targetAudience || "",
        competitors: initialIdentity?.competitors || "",
    });

    const steps = [
        {
            id: "welcome",
            title: "Bienvenido a Lumen",
            subtitle: `Es hora de construir el ADN de ${initialClient.name}.`,
            icon: Sparkles
        },
        {
            id: "basic",
            title: "Información General",
            subtitle: "Datos básicos para mantenernos en contacto.",
            icon: Building2
        },
        {
            id: "essence",
            title: "Esencia de Marca",
            subtitle: "El alma detrás de lo que haces.",
            icon: Target
        },
        {
            id: "audience",
            title: "Audiencia y Competencia",
            subtitle: "¿A quién le hablamos y con quién competimos?",
            icon: Users
        },
        {
            id: "finish",
            title: "¡Todo Listo!",
            subtitle: "Tu espacio está configurado y sincronizado.",
            icon: CheckCircle
        }
    ];

    const handleNext = async () => {
        if (step === steps.length - 2) {
            // Final step before finish, save data
            setIsSaving(true);
            try {
                const res = await fetch(`/api/onboarding/${initialClient.portalToken}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ clientData, identityData })
                });
                
                if (res.ok) {
                    setStep(step + 1);
                    setSaved(true);
                } else {
                    alert("Hubo un error al guardar. Intenta de nuevo.");
                }
            } catch (error) {
                console.error(error);
            } finally {
                setIsSaving(false);
            }
        } else {
            setStep(step + 1);
        }
    };

    const handleBack = () => setStep(step - 1);

    const renderStepContent = () => {
        switch (step) {
            case 0:
                return (
                    <div className="text-center py-12">
                        <div className="w-24 h-24 bg-lumen-priority/10 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-lumen-priority/20 rounded-full animate-ping opacity-20" />
                            <Sparkles className="w-12 h-12 text-lumen-priority relative z-10" />
                        </div>
                        <h2 className="lumen-title text-5xl font-black text-gray-900 mb-6 leading-tight">
                            Smart <br/>Onboarding
                        </h2>
                        <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
                            Vamos a configurar tu perfil, entender tu esencia de marca y alinear los objetivos para que nuestro sistema de IA genere el mejor contenido para ti.
                        </p>
                    </div>
                );
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Industria / Rubro</label>
                            <input
                                type="text"
                                placeholder="Ej: Restaurante, Inmobiliaria..."
                                value={clientData.industry}
                                onChange={(e) => setClientData({ ...clientData, industry: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sitio Web / Instagram</label>
                            <input
                                type="text"
                                placeholder="www.tuempresa.com"
                                value={clientData.website}
                                onChange={(e) => setClientData({ ...clientData, website: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contacto Principal</label>
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={clientData.contactName}
                                    onChange={(e) => setClientData({ ...clientData, contactName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp</label>
                                <input
                                    type="tel"
                                    placeholder="+123456789"
                                    value={clientData.contactPhone}
                                    onChange={(e) => setClientData({ ...clientData, contactPhone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Propósito Superior</label>
                            <p className="text-xs text-gray-400 mb-2">¿Por qué existe tu marca más allá de hacer dinero?</p>
                            <textarea
                                value={identityData.purpose}
                                onChange={(e) => setIdentityData({ ...identityData, purpose: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm"
                                placeholder="Ej: Queremos democratizar el acceso a la tecnología..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tono de Voz</label>
                            <textarea
                                value={identityData.toneOfVoice}
                                onChange={(e) => setIdentityData({ ...identityData, toneOfVoice: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm"
                                placeholder="Ej: Cercano, profesional pero no aburrido, inspirador..."
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Arquetipo de Marca</label>
                            <input
                                type="text"
                                value={identityData.archetype}
                                onChange={(e) => setIdentityData({ ...identityData, archetype: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm"
                                placeholder="Ej: El Mago, El Sabio, El Rebelde..."
                            />
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Público Objetivo (Buyer Persona)</label>
                            <p className="text-xs text-gray-400 mb-2">Describe a tu cliente ideal, sus dolores y deseos.</p>
                            <textarea
                                value={identityData.targetAudience}
                                onChange={(e) => setIdentityData({ ...identityData, targetAudience: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[120px] resize-none shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Competencia Directa e Indirecta</label>
                            <textarea
                                value={identityData.competitors}
                                onChange={(e) => setIdentityData({ ...identityData, competitors: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all min-h-[100px] resize-none shadow-sm"
                                placeholder="Ej: Marca A (fuerte en diseño), Marca B (buenos precios)..."
                            />
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="text-center py-16">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8"
                        >
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </motion.div>
                        <h2 className="lumen-title text-4xl font-black text-gray-900 mb-4">
                            ¡Misión Cumplida!
                        </h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Toda tu información ha sido guardada y nuestro Laboratorio de IA ya está procesando tu ADN para generar contenido increíble.
                        </p>
                        <a href={`/portal/${initialClient.portalToken}`} className="lumen-btn lumen-btn-primary">
                            Ir a mi Portal de Cliente
                        </a>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 md:p-8 font-sans">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* Left Sidebar (Progress) */}
                <div className="w-full md:w-64 bg-gray-50 border-r border-gray-100 p-8 hidden md:flex flex-col relative overflow-hidden">
                    {/* Brand top */}
                    <div className="mb-12 relative z-10">
                        <span className="font-black text-xl tracking-tight text-gray-900">
                            LUMEN<span className="text-lumen-priority">·</span>OS
                        </span>
                    </div>

                    <div className="space-y-8 relative z-10">
                        {steps.map((s, idx) => {
                            const isActive = step === idx;
                            const isPast = step > idx;
                            return (
                                <div key={s.id} className="flex gap-4 relative">
                                    {idx !== steps.length - 1 && (
                                        <div className={`absolute top-8 left-3 w-px h-8 ${isPast ? 'bg-lumen-priority' : 'bg-gray-200'}`} />
                                    )}
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${isActive ? 'bg-lumen-priority text-white shadow-md shadow-lumen-priority/30' : isPast ? 'bg-lumen-priority text-white' : 'bg-white border-2 border-gray-200 text-gray-400'}`}>
                                        {isPast ? <CheckCircle className="w-3.5 h-3.5" /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold transition-colors ${isActive ? 'text-gray-900' : isPast ? 'text-gray-700' : 'text-gray-400'}`}>{s.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    
                    {/* Decorative gradient */}
                    <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-gray-200/50 to-transparent pointer-events-none" />
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-white">
                    {/* Header mobile */}
                    <div className="md:hidden p-6 border-b border-gray-100 flex justify-between items-center">
                        <span className="font-black text-lg text-gray-900">LUMEN<span className="text-lumen-priority">·</span>OS</span>
                        <span className="text-xs font-bold text-gray-400">Paso {step + 1} de {steps.length}</span>
                    </div>

                    <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full"
                            >
                                {step > 0 && step < steps.length - 1 && (
                                    <div className="mb-8">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-lumen-priority/10 text-lumen-priority mb-4">
                                            {steps[step].icon && (() => { const Icon = steps[step].icon; return <Icon className="w-6 h-6" /> })()}
                                        </div>
                                        <h2 className="lumen-title text-3xl font-black text-gray-900 mb-2">{steps[step].title}</h2>
                                        <p className="text-gray-500">{steps[step].subtitle}</p>
                                    </div>
                                )}
                                {renderStepContent()}
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Footer Controls */}
                    {step < steps.length - 1 && (
                        <div className="p-6 md:px-12 md:py-8 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                            {step > 0 ? (
                                <button onClick={handleBack} className="lumen-btn lumen-btn-ghost text-gray-500 hover:text-gray-900">
                                    <ArrowLeft className="w-4 h-4" />
                                    Atrás
                                </button>
                            ) : <div></div>}
                            
                            <button
                                onClick={handleNext}
                                disabled={isSaving}
                                className="lumen-btn lumen-btn-primary"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : step === steps.length - 2 ? (
                                    "Finalizar y Guardar"
                                ) : (
                                    <>Siguiente <ArrowRight className="w-4 h-4" /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
