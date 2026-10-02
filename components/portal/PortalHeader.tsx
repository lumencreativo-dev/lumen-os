"use client";

import { useBrand } from "@/contexts/BrandContext";
import { NotificationCenter } from "@/components/portal/NotificationCenter";

export function PortalHeader() {
    const { brandColor, logoUrl, clientName } = useBrand();

    return (
        <header className="border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-20">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left: Lumen brand + client logo */}
                <div className="flex items-center gap-3">
                    {/* Lumen Icon */}
                    <div className="w-9 h-9 bg-gradient-to-br from-gray-900 to-gray-700 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <span className="text-white font-bold text-sm">L</span>
                    </div>
                    <div className="hidden sm:block">
                        <span className="font-bold text-gray-900 tracking-tight">LUMEN</span>
                        <span className="text-gray-400 font-medium ml-1.5 text-sm">Portal</span>
                    </div>

                    {/* Separator + Client logo (only when branding is loaded) */}
                    {clientName && (
                        <>
                            <div className="w-px h-6 bg-gray-200 mx-1" />
                            <div
                                className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm overflow-hidden flex-shrink-0 border border-gray-100"
                                style={{ background: logoUrl ? 'white' : brandColor }}
                            >
                                {logoUrl ? (
                                    <img src={logoUrl} alt={clientName} className="w-full h-full object-contain p-0.5" />
                                ) : (
                                    <span className="text-white text-xs font-black">
                                        {clientName.substring(0, 1).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <span className="hidden md:block text-sm font-semibold text-gray-700 truncate max-w-[140px]">
                                {clientName}
                            </span>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Notification Center */}
                    <NotificationCenter />

                    {/* Brand color dot indicator */}
                    {clientName && (
                        <div
                            className="w-3 h-3 rounded-full ring-2 ring-white shadow-sm"
                            style={{ backgroundColor: brandColor }}
                            title={`Color de marca: ${brandColor}`}
                        />
                    )}

                    {/* Version Badge */}
                    <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                        En línea
                    </div>
                </div>
            </div>
        </header>
    );
}
