"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft, CheckCircle, Sparkles, Building2, User, Loader2 } from "lucide-react";

interface OnboardingWizardProps {
    initialClient: any;
    initialIdentity: any; // We might not need this here anymore, but keeping for compatibility
}

export default function OnboardingWizard({ initialClient }: OnboardingWizardProps) {
    const [step, setStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Form states - Only basic info for the initial onboarding
    const [clientData, setClientData] = useState({
        industry: initialClient.industry || "",
        website: initialClient.website || "",
        contactName: initialClient.contactName || "",
        contactPhone: initialClient.contactPhone || "",
    });

    const steps = [
        {
            id: "welcome",
            title: "Bienvenido a Lumen",
            subtitle: `Hola ${initialClient.name}, estamos listos para empezar.`,
            icon: Sparkles
        },
        {
            id: "basic",
            title: "Datos de Contacto",
            subtitle: "Confirmemos tu información básica para iniciar.",
            icon: User
        },
        {
            id: "finish",
            title: "¡Todo Listo!",
            subtitle: "Tu portal de cliente está preparado.",
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
                    // We send empty identityData so the API doesn't fail if it expects it
                    body: JSON.stringify({ clientData, identityData: {} })
                });
                
                if (res.ok) {
                    setStep(step + 1);
                    setSaved(true);
                } else {
                    const data = await res.json();
                    alert(`Hubo un error al guardar: ${data.error || 'Intenta de nuevo.'}`);
                }
            } catch (error) {
                console.error(error);
                alert("Hubo un error de conexión.");
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
                        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-8 relative">
                            <div className="absolute inset-0 bg-orange-100 rounded-full animate-ping opacity-50" />
                            <Sparkles className="w-12 h-12 text-lumen-priority relative z-10" />
                        </div>
                        <h2 className="lumen-title text-5xl font-black text-gray-900 mb-6 leading-tight">
                            Comencemos.
                        </h2>
                        <p className="text-lg text-gray-500 max-w-lg mx-auto leading-relaxed">
                            Te damos la bienvenida a tu nuevo espacio de trabajo. En solo 2 simples pasos configuraremos tu acceso a Lumen OS para que puedas gestionar tus proyectos y contenidos.
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
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sitio Web / Instagram</label>
                            <input
                                type="text"
                                placeholder="www.tuempresa.com"
                                value={clientData.website}
                                onChange={(e) => setClientData({ ...clientData, website: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre del Encargado</label>
                                <input
                                    type="text"
                                    placeholder="Nombre"
                                    value={clientData.contactName}
                                    onChange={(e) => setClientData({ ...clientData, contactName: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">WhatsApp Principal</label>
                                <input
                                    type="tel"
                                    placeholder="+123456789"
                                    value={clientData.contactPhone}
                                    onChange={(e) => setClientData({ ...clientData, contactPhone: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-lumen-priority focus:ring-2 focus:ring-lumen-priority/20 outline-none transition-all shadow-sm bg-gray-50/50"
                                />
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="text-center py-16">
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", bounce: 0.5 }}
                            className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8"
                        >
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </motion.div>
                        <h2 className="lumen-title text-4xl font-black text-gray-900 mb-4">
                            ¡Misión Cumplida!
                        </h2>
                        <p className="text-gray-500 max-w-md mx-auto mb-8">
                            Tus datos básicos están confirmados. Ahora pasaremos a tu Portal de Cliente, donde podrás darnos más detalles sobre tu marca.
                        </p>
                        <a href={`/portal/${initialClient.portalToken}`} className="lumen-btn lumen-btn-primary px-8">
                            Ir a mi Portal
                        </a>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">
            {/* Soft background elements */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-100/40 to-transparent pointer-events-none" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-lumen-priority/10 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden flex flex-col min-h-[550px] relative z-10">
                
                {/* Header Progress */}
                <div className="px-8 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm flex justify-between items-center sticky top-0 z-20">
                    <span className="font-black text-xl tracking-tight text-gray-900">
                        LUMEN<span className="text-lumen-priority">·</span>OS
                    </span>
                    <div className="flex gap-2">
                        {steps.map((s, idx) => (
                            <div 
                                key={s.id} 
                                className={`h-2 rounded-full transition-all duration-500 ${
                                    step >= idx ? 'w-8 bg-lumen-priority' : 'w-4 bg-gray-100'
                                }`} 
                            />
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col relative bg-white">
                    <div className="flex-1 p-8 md:p-12 flex flex-col justify-center relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={step}
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -15 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="w-full max-w-xl mx-auto"
                            >
                                {step > 0 && step < steps.length - 1 && (
                                    <div className="mb-10 text-center">
                                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-lumen-priority mb-4">
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
                        <div className="p-6 md:px-12 md:py-6 border-t border-gray-50 flex justify-between items-center bg-gray-50/50">
                            {step > 0 ? (
                                <button onClick={handleBack} className="lumen-btn lumen-btn-ghost text-gray-500 hover:text-gray-900 px-4">
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Atrás
                                </button>
                            ) : <div></div>}
                            
                            <button
                                onClick={handleNext}
                                disabled={isSaving}
                                className="lumen-btn lumen-btn-primary px-8 shadow-md shadow-lumen-priority/20"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : step === steps.length - 2 ? (
                                    "Comenzar"
                                ) : (
                                    <>Siguiente <ArrowRight className="w-4 h-4 ml-2" /></>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
