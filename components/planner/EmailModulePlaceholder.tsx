'use client';

import { Mail, Sparkles, ShieldCheck, Zap, Send, CheckCircle2, Construction } from 'lucide-react';

export function EmailModulePlaceholder() {
    return (
        <div className="max-w-4xl mx-auto py-8 space-y-8">
            {/* Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161616] via-[#121212] to-[#0A0A0A] border border-white/10 p-8 md:p-12 text-center space-y-4 shadow-2xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#F7931E]/10 rounded-full blur-3xl pointer-events-none" />

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                    <Construction className="w-3.5 h-3.5" />
                    <span>Módulo 03 · En Construcción</span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight">
                    Tu Correo, Tu Dominio con <span className="text-[#F7931E]">Resend</span>
                </h2>

                <p className="text-white/60 text-sm max-w-xl mx-auto leading-relaxed">
                    Reemplaza herramientas como Mailchimp o ActiveCampaign. Envía desde tu propio dominio,
                    conecta secuencias automáticas para cada nuevo lead y gestiona tus contactos sin costos inflados.
                </p>

                <div className="pt-2 flex items-center justify-center gap-3">
                    <span className="text-xs text-white/40 font-mono">
                        Estará disponible una vez configurada la zona DNS del dominio.
                    </span>
                </div>
            </div>

            {/* Feature Previews */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-bold text-sm">Dominio Propio & DMARC</h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                        Firma DKIM y SPF para asegurar que tus correos lleguen directo a la bandeja de entrada y nunca a spam.
                    </p>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F7931E]/15 border border-[#F7931E]/30 flex items-center justify-center text-[#F7931E]">
                        <Zap className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-bold text-sm">Bienvenida Automática</h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                        Cuando un lead complete el formulario web, Resend le entregará el correo de bienvenida al instante sin mover un dedo.
                    </p>
                </div>

                <div className="bg-[#141414] border border-white/5 rounded-2xl p-5 space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Send className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-bold text-sm">Campañas & Broadcasts</h3>
                    <p className="text-white/40 text-xs leading-relaxed">
                        Envía newsletters y comunicados a toda tu lista de contactos sin límites de contactos mensuales forzados.
                    </p>
                </div>
            </div>

            {/* Checklist de Preparación */}
            <div className="bg-[#141414] border border-white/5 rounded-2xl p-6 space-y-3">
                <h4 className="text-white font-bold text-sm">Checklist para activar este módulo:</h4>
                <ul className="space-y-2 text-xs text-white/70">
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40">1</div>
                        <span>Comprar o tener acceso a la zona DNS del dominio oficial de Lumen Creativo.</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40">2</div>
                        <span>Crear cuenta gratuita en Resend y configurar el subdominio de envíos (ej: <code className="text-[#F7931E]">news.tumarca.com</code>).</span>
                    </li>
                    <li className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20 flex items-center justify-center text-[10px] text-white/40">3</div>
                        <span>Agregar las variables de entorno <code className="text-[#F7931E]">RESEND_API_KEY</code> en Vercel.</span>
                    </li>
                </ul>
            </div>
        </div>
    );
}
